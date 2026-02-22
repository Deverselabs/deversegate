import { db } from './db';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_URL = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

async function getTransactionsForAddress(address: string) {
  try {
    const response = await fetch(ALCHEMY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromBlock: '0x0',
            toBlock: 'latest',
            toAddress: address,
            excludeZeroValue: true,
            category: ['external', 'erc20'],
            maxCount: '0x64',
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('[payment-monitor] Alchemy error:', data.error);
      return [];
    }

    return data.result?.transfers || [];
  } catch (error) {
    console.error('[payment-monitor] Failed to fetch transactions:', error);
    return [];
  }
}

function matchesAmount(
  transferAmount: number,
  invoiceAmount: number,
  currency: string
): boolean {
  // For ETH - compare with small tolerance for decimals
  if (currency === 'ETH' || currency === 'WETH') {
    const tolerance = 0.0001;
    return Math.abs(transferAmount - invoiceAmount) < tolerance;
  }

  // For USDC/USDT/DAI - compare directly
  const tolerance = 0.01;
  return Math.abs(transferAmount - invoiceAmount) < tolerance;
}

export async function monitorPayments() {
  console.log('[payment-monitor] 🚀 Starting payment check...');

  try {
    // Get all unpaid invoices (schema no longer has paymentAddress; monitor is effectively disabled for new invoices)
    const unpaidInvoices = await db.invoice.findMany({
      where: { status: "UNPAID" },
    });

    console.log(`[payment-monitor] 📋 Found ${unpaidInvoices.length} unpaid invoices`);

    const usedTxHashes = await db.invoice.findMany({
      where: { paymentTxHash: { not: null } },
      select: { paymentTxHash: true },
    });

    const usedTxHashSet = new Set(
      usedTxHashes
        .map((inv) => inv.paymentTxHash)
        .filter((h): h is string => h != null)
    );

    console.log(`[payment-monitor] 📝 Found ${usedTxHashSet.size} already-used transactions`);

    let detected = 0;
    let updated = 0;

    for (const invoice of unpaidInvoices) {
      const paymentAddress = (invoice as { paymentAddress?: string | null })
        .paymentAddress;
      if (!paymentAddress) continue;

      console.log(
        `[payment-monitor] 🔍 Checking invoice ${invoice.invoiceNumber} - ${invoice.amount} ${invoice.currency}`
      );
      console.log(`[payment-monitor] 📍 Address: ${paymentAddress}`);

      const transfers = await getTransactionsForAddress(paymentAddress);

      console.log(`[payment-monitor] 📊 Found ${transfers.length} transactions`);

      const invoiceAmount = parseFloat(invoice.amount);

      // Find a matching transfer that hasn't been used yet
      let matchingTransfer = null;
      
      for (const transfer of transfers) {
        const transferAmount = parseFloat(transfer.value || '0');
        const txHash = transfer.hash;

        console.log(`[payment-monitor] Comparing: transfer=${transferAmount} (tx: ${txHash.substring(0, 10)}...) vs invoice=${invoiceAmount}`);

        // Check if amount matches AND transaction not already used
        if (matchesAmount(transferAmount, invoiceAmount, invoice.currency)) {
          if (usedTxHashSet.has(txHash)) {
            console.log(`[payment-monitor] ⚠️ Transaction ${txHash.substring(0, 10)}... already used, skipping`);
            continue;
          }
          
          // Found a matching, unused transaction!
          matchingTransfer = transfer;
          break;
        }
      }

      if (matchingTransfer) {
        console.log(`[payment-monitor] ✅ PAYMENT FOUND! Tx: ${matchingTransfer.hash}`);
        detected++;

        try {
          // Update invoice to PAID
          await db.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'PAID',
              paymentTxHash: matchingTransfer.hash,
              paidAt: new Date(),
            },
          });

          console.log(`[payment-monitor] ✅ Invoice ${invoice.invoiceNumber} marked as PAID!`);
          
          // Add to used set to avoid reusing in same run
          usedTxHashSet.add(matchingTransfer.hash);
          
          updated++;
        } catch (error) {
          console.error(`[payment-monitor] ❌ Failed to update invoice ${invoice.invoiceNumber}:`, error);
        }
      } else {
        console.log(`[payment-monitor] ⏳ No matching unused payment found for invoice ${invoice.invoiceNumber}`);
      }
    }

    console.log(`[payment-monitor] 🏁 Done! Checked: ${unpaidInvoices.length}, Detected: ${detected}, Updated: ${updated}`);

    return {
      checked: unpaidInvoices.length,
      detected,
      updated,
    };
  } catch (error) {
    console.error('[payment-monitor] ❌ Monitor failed:', error);
    throw error;
  }
}
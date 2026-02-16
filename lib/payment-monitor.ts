import { Alchemy, Network, AssetTransfersCategory } from 'alchemy-sdk';
import { parseEther } from 'viem';
import { db } from './db';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  console.warn(
    '[payment-monitor] ALCHEMY_API_KEY is not set. Blockchain payment monitoring will not work.'
  );
}

const alchemy = ALCHEMY_API_KEY
  ? new Alchemy({
      apiKey: ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    })
  : null;

/** Lookback: max number of transfers to fetch per address when checking for payments */
const MAX_TRANSFERS_PER_ADDRESS = 100;

/** Summary returned by monitorPayments */
export interface PaymentMonitorSummary {
  checked: number;
  detected: number;
  updated: string[];
  errors: { invoiceId: string; error: string }[];
}

/**
 * Convert invoice amount (in ETH) to Wei as bigint for comparison with chain data.
 * Assumes currency is ETH when monitoring mainnet.
 */
function amountToWei(amount: string | number): bigint {
  const str = typeof amount === 'number' ? amount.toString() : amount;
  return parseEther(str);
}

/**
 * Parse raw value from Alchemy transfer (hex string) to bigint.
 */
function rawValueToBigInt(raw: string | undefined | null): bigint | null {
  if (raw == null || raw === '') return null;
  try {
    const hex = raw.startsWith('0x') ? raw : `0x${raw}`;
    return BigInt(hex);
  } catch {
    return null;
  }
}

/**
 * Check a single address for a payment matching the expected amount (in ETH).
 * Returns the transaction hash if a matching incoming ETH transfer is found, null otherwise.
 */
export async function checkAddressForPayment(
  address: string,
  expectedAmountEth: string | number
): Promise<string | null> {
  if (!alchemy) {
    console.error('[payment-monitor] Alchemy not initialized (missing ALCHEMY_API_KEY)');
    return null;
  }

  const expectedWei = amountToWei(expectedAmountEth);

  try {
    const { transfers } = await alchemy.core.getAssetTransfers({
      fromBlock: '0x0',
      toBlock: 'latest',
      toAddress: address.toLowerCase(),
      excludeZeroValue: true,
      category: [AssetTransfersCategory.EXTERNAL],
      maxCount: MAX_TRANSFERS_PER_ADDRESS,
    });

    for (const transfer of transfers) {
      if (transfer.asset?.toUpperCase() !== 'ETH') continue;

      const rawWei = rawValueToBigInt(transfer.rawContract?.value);
      if (rawWei === null) continue;

      if (rawWei === expectedWei) {
        return transfer.hash ?? null;
      }
    }

    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[payment-monitor] checkAddressForPayment failed for ${address}:`, message);
    throw err;
  }
}

/**
 * Scan all unpaid invoices with a payment address, detect matching blockchain
 * payments, and update invoice status. Returns a summary of what was checked and updated.
 */
export async function monitorPayments(): Promise<PaymentMonitorSummary> {
  const summary: PaymentMonitorSummary = {
    checked: 0,
    detected: 0,
    updated: [],
    errors: [],
  };

  if (!alchemy) {
    console.error('[payment-monitor] Alchemy not initialized. Skipping monitorPayments.');
    return summary;
  }

  type UnpaidRow = { id: string; amount: { toString(): string }; paymentAddress: string | null };
  let unpaidInvoices: UnpaidRow[];

  try {
    unpaidInvoices = await db.invoice.findMany({
      where: {
        status: 'UNPAID',
        paymentAddress: { not: null },
      },
      select: { id: true, amount: true, paymentAddress: true },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[payment-monitor] Failed to fetch unpaid invoices:', message);
    throw err;
  }

  const withAddress = unpaidInvoices.filter(
    (inv): inv is UnpaidRow & { paymentAddress: string } => inv.paymentAddress != null
  );
  summary.checked = withAddress.length;

  if (summary.checked === 0) {
    return summary;
  }

  for (const invoice of withAddress) {
    const address = invoice.paymentAddress;
    let expectedEth: string;
    try {
      expectedEth = invoice.amount.toString();
    } catch {
      summary.errors.push({ invoiceId: invoice.id, error: 'Invalid amount' });
      continue;
    }

    let txHash: string | null;
    try {
      txHash = await checkAddressForPayment(address, expectedEth);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.errors.push({ invoiceId: invoice.id, error: message });
      continue;
    }

    if (!txHash) continue;

    summary.detected += 1;

    try {
      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'PAID',
          paymentTxHash: txHash,
          paidAt: new Date(),
        },
      });
      summary.updated.push(invoice.id);
      console.info(
        `[payment-monitor] Payment detected: invoice ${invoice.id} updated to PAID (tx: ${txHash})`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.errors.push({ invoiceId: invoice.id, error: `DB update failed: ${message}` });
      console.error(`[payment-monitor] Failed to update invoice ${invoice.id}:`, message);
    }
  }

  return summary;
}

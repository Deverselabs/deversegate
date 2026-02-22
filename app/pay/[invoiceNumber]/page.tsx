'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  clientName: string;
  description?: string;
  merchantWallet: string | null;
  contractAddress?: string | null;
  network?: string;
  status: string;
}

export default function PaymentPage({ params }: { params: Promise<{ invoiceNumber: string }> }) {
  const resolvedParams = use(params);
  const invoiceNumber = resolvedParams.invoiceNumber;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    fetch(`/api/invoices/by-number/${invoiceNumber}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Invoice not found');
        return r.json();
      })
      .then(data => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [invoiceNumber]);

  async function handlePayment() {
    if (!invoice || !walletClient || !address) {
      setError("Wallet not connected properly. Please refresh and try again.");
      return;
    }

    const merchantAddr = invoice.merchantWallet;
    if (!merchantAddr) {
      setError("Merchant wallet not configured for this invoice.");
      return;
    }

    setPaying(true);
    setError("");

    try {
      console.log("🔄 Preparing transaction...");
      console.log("Invoice:", invoice.invoiceNumber);
      console.log("Amount:", invoice.amount, invoice.currency);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Transaction timed out after 60 seconds. Please try again."
              )
            ),
          60000
        )
      );

      let hash: `0x${string}`;

      if (invoice.contractAddress) {
        const CONTRACT_ABI = [
          {
            inputs: [
              { name: "invoiceNumber", type: "string" },
              { name: "recipient", type: "address" },
            ],
            name: "payInvoice",
            outputs: [],
            stateMutability: "payable",
            type: "function",
          },
        ];
        const txPromise = walletClient.writeContract({
          address: invoice.contractAddress as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: "payInvoice",
          args: [invoice.invoiceNumber, merchantAddr as `0x${string}`],
          value: parseEther(invoice.amount),
        });
        hash = (await Promise.race([txPromise, timeoutPromise])) as `0x${string}`;
      } else {
        const txPromise = walletClient.sendTransaction({
          to: merchantAddr as `0x${string}`,
          value: parseEther(invoice.amount),
        });
        hash = (await Promise.race([txPromise, timeoutPromise])) as `0x${string}`;
      }

      console.log("✅ Transaction sent! Hash:", hash);
      setTxHash(hash);
      setSuccess(true);
    } catch (err: unknown) {
      console.error("❌ Payment error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const shortMsg = err && typeof err === "object" && "shortMessage" in err ? String((err as { shortMessage?: string }).shortMessage) : errMsg;
      if (errMsg.includes("User rejected") || errMsg.includes("denied")) {
        setError('Transaction was cancelled. Click "Pay" to try again.');
      } else if (errMsg.includes("timeout") || errMsg.includes("expired")) {
        setError("MetaMask took too long to respond. Please check if MetaMask is unlocked and try again.");
      } else if (errMsg.includes("insufficient funds")) {
        setError(`Insufficient funds. You need at least ${parseFloat(invoice.amount) + 0.002} ${invoice.currency} (${invoice.amount} + gas).`);
      } else if (errMsg.includes("network")) {
        setError("Wrong network. Please switch to the correct network in MetaMask.");
      } else {
        setError(`Payment failed: ${shortMsg || errMsg}. Please try again.`);
      }
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 border-2 border-red-500/20 shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4 text-center">Invoice Not Found</h1>
          <p className="text-muted-foreground text-center mb-6">
            The invoice {invoiceNumber} could not be found.
          </p>
          <Link href="/dashboard">
            <button className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  if (invoice.status === 'PAID') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 border-2 border-green-500/20 shadow-xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">Already Paid</h1>
          <p className="text-muted-foreground text-center mb-6">
            This invoice has already been paid.
          </p>
          <Link href="/dashboard">
            <button className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    const etherscanUrl = `https://${invoice.network}.etherscan.io/tx/${txHash}`;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 border-2 border-green-500/20 shadow-xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">Payment Sent!</h1>
          <p className="text-muted-foreground text-center mb-6">
            Your payment is being processed. The invoice will be updated automatically within 30 seconds.
          </p>
          {txHash && (
            <a 
              href={etherscanUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block w-full text-center bg-gradient-to-r from-amber-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity mb-4"
            >
              View Transaction on Etherscan
            </a>
          )}
          <Link href="/dashboard/invoices">
            <button className="w-full py-3 px-4 border border-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors">
              View All Invoices
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl p-8 border border-border shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Pay Invoice</h1>
          <div className="w-5" /> {/* Spacer */}
        </div>
        
        {/* Invoice Details */}
        <div className="space-y-4 mb-6 bg-muted/50 rounded-xl p-4 border border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Invoice:</span>
            <span className="font-mono font-semibold text-foreground">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">To:</span>
            <span className="font-medium text-foreground">{invoice.clientName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Description:</span>
            <span className="font-medium text-foreground text-right max-w-[200px] truncate">
              {invoice.description}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-4">
            <span className="text-muted-foreground text-sm">Amount:</span>
            <span className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              {invoice.amount} {invoice.currency}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Connect Wallet or Pay */}
        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm text-center">
              Connect your wallet to pay this invoice
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Connected Wallet Info */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-muted-foreground text-xs mb-2">Connected Wallet:</p>
              <p className="text-foreground font-mono text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
            
            {/* MetaMask Alert */}
            {paying && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-pulse">
                <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold text-center">
                  ⚠️ CHECK METAMASK
                </p>
                <p className="text-amber-600/80 dark:text-amber-400/80 text-xs text-center mt-1">
                  Confirm the transaction in your wallet
                </p>
              </div>
            )}
            
            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full bg-gradient-to-r from-amber-500 to-red-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity shadow-lg shadow-amber-500/20"
            >
              {paying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${invoice.amount} ${invoice.currency}`
              )}
            </button>

            {/* Info Text */}
            <p className="text-muted-foreground text-xs text-center">
              Secured by smart contract • Network: {invoice.network}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-muted-foreground text-xs text-center">
            Powered by DeverseGate
          </p>
        </div>
      </div>
    </div>
  );
}

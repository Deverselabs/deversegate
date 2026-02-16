'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  Download, 
  Edit, 
  Calendar, 
  User, 
  Wallet,
  Copy,
  Check,
  Camera,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  clientName: string;
  clientEmail: string;
  clientWallet?: string;
  description: string;
  dueDate: string;
  paymentAddress: string;
  createdAt: string;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  UNPAID: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-600' },
  PAID: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-600' },
  PENDING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-600' },
  OVERDUE: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-600' },
  CANCELLED: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-600' },
};

const getNetworkInfo = (currency: string) => {
  const networks: Record<string, string> = {
    'USDC': 'Ethereum Mainnet (ERC-20)',
    'USDT': 'Ethereum Mainnet (ERC-20)',
    'DAI': 'Ethereum Mainnet (ERC-20)',
    'ETH': 'Ethereum Network',
    'WETH': 'Ethereum Network',
  };
  return networks[currency] || 'Ethereum Mainnet (ERC-20)';
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
          
          // Generate QR code
          if (data.paymentAddress) {
            const qr = await QRCode.toDataURL(data.paymentAddress, {
              width: 200,
              margin: 2,
              color: { dark: '#1e293b', light: '#ffffff' }
            });
            setQrCode(qr);
          }
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvoice();
  }, [params.id]);

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}/send-email`, {
        method: 'POST',
      });
      
      if (res.ok) {
        toast({
          title: 'Email sent!',
          description: `Invoice sent to ${invoice?.clientEmail}`,
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send email. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      const { generateInvoicePDF } = await import('@/lib/pdf-generator');
      const pdfBlob = await generateInvoicePDF(invoice);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'PDF downloaded!' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download PDF',
      });
    } finally {
      setDownloading(false);
    }
  };

  const copyAddress = () => {
    if (invoice?.paymentAddress) {
      navigator.clipboard.writeText(invoice.paymentAddress);
      setCopied(true);
      toast({ title: 'Address copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invoice not found</h1>
          <Link href="/dashboard/invoices">
            <Button variant="outline">Back to Invoices</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[invoice.status] || STATUS_STYLES.UNPAID;
  const networkInfo = getNetworkInfo(invoice.currency);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/dashboard/invoices"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Back to Invoices</span>
          </Link>
        </div>

        {/* Main Invoice Card */}
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Header Section */}
          <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-start gap-8">
            {/* Left: Branding & Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-lg">D</span>
                </div>
                <span className="text-2xl font-extrabold tracking-tight">
                  DEVERSE<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-red-600">GATE</span>
                </span>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900">
                  {invoice.invoiceNumber}
                </h1>
                <p className="text-sm text-slate-500">
                  Invoice created {new Date(invoice.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Right: Status & Amount */}
            <div className="text-right">
              <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0 px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4`}>
                <span className={`${statusStyle.dot} w-2 h-2 rounded-full mr-2 animate-pulse`}></span>
                {invoice.status}
              </Badge>
              
              <div className="mt-4">
                <div className="text-5xl font-black text-slate-900">
                  {parseFloat(invoice.amount).toLocaleString()}
                </div>
                <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-red-600 uppercase tracking-wider mt-1">
                  {invoice.currency}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 md:px-12 pb-8 flex flex-wrap gap-3">
            <Button
              onClick={handleSendEmail}
              disabled={sending}
              className="bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              variant="outline"
              className="border-slate-300"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            
            <Button
              onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}
              variant="outline"
              className="border-slate-300"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 md:px-12 md:py-10 bg-slate-50 border-y border-slate-200">
            {/* Client Info */}
            <div>
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User className="w-3 h-3" />
                Client
              </h4>
              <p className="font-bold text-slate-900 text-lg mb-1">{invoice.clientName}</p>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {invoice.clientEmail}
              </p>
              {invoice.clientWallet && (
                <div className="mt-3 px-3 py-1 bg-slate-200/50 rounded-md text-[10px] font-mono text-slate-600 truncate">
                  {invoice.clientWallet}
                </div>
              )}
            </div>

            {/* Dates */}
            <div>
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Dates
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block">Due Date</span>
                  <span className="text-sm font-bold text-red-600">
                    {new Date(invoice.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                Description
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {invoice.description}
              </p>
            </div>
          </div>

          {/* Payment Section */}
          <div className="m-8 md:mx-12 md:mb-12 p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
              {/* Left: Instructions */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
                    Payment Instructions
                  </h3>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed">
                  Please transfer exactly <span className="text-white font-bold">{parseFloat(invoice.amount).toLocaleString()} {invoice.currency}</span>. 
                  Only send digital assets over the <span className="font-bold text-white">{networkInfo}</span> network.
                </p>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Wallet Address
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-indigo-200 break-all">
                      {invoice.paymentAddress}
                    </div>
                    <Button
                      onClick={copyAddress}
                      className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-xl"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Right: QR Code */}
              <div className="flex flex-col items-center">
                {qrCode && (
                  <>
                    <div className="bg-white p-4 rounded-2xl shadow-2xl">
                      <img src={qrCode} alt="Payment QR Code" className="w-40 h-40" />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Camera className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Scan to Pay
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 md:px-12 md:pb-12 text-center border-t border-slate-100">
            <p className="text-sm font-bold text-slate-900 italic">DeverseGate Official Invoice</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-1">
              Powered by Deverse Labs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

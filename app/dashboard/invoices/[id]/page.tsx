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
  paymentPageUrl?: string | null;
  merchantWallet?: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  UNPAID: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-600' },
  PAID: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-600' },
  PENDING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-600' },
  OVERDUE: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-600' },
  CANCELLED: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-600' },
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
          
          // Generate QR code for payment page (not wallet address)
          const paymentPageUrl = data.paymentPageUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/pay/${data.invoiceNumber}`;
          if (paymentPageUrl) {
            const qr = await QRCode.toDataURL(paymentPageUrl, {
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
      const pdfBlob = await generateInvoicePDF({
        ...invoice,
        paymentPageUrl: invoice.paymentPageUrl ?? null,
        merchantWallet: invoice.merchantWallet ?? null,
      });
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

  const paymentPageUrl = invoice?.paymentPageUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/pay/${invoice?.invoiceNumber ?? ''}`;

  const copyPaymentUrl = () => {
    if (paymentPageUrl) {
      navigator.clipboard.writeText(paymentPageUrl);
      setCopied(true);
      toast({ title: 'Payment link copied!' });
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
          <div className="m-8 md:mx-12 md:mb-12 border border-slate-200 rounded-3xl p-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment Instructions</h3>
              <p className="text-sm text-slate-600">
                Pay securely via our payment page. Your payment will be automatically verified.
              </p>
            </div>

            {/* Payment Page Link */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Payment Link:</p>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <a
                  href={paymentPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-amber-600 hover:underline flex-1 break-all"
                >
                  {paymentPageUrl}
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyPaymentUrl}
                  className="shrink-0 p-2 hover:bg-slate-200 rounded-lg border-slate-200"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-slate-200">
              <p className="text-sm font-medium text-slate-700">Scan to Pay</p>
              {qrCode && (
                <img src={qrCode} alt="Payment page QR Code" className="w-[200px] h-[200px]" />
              )}
              <div className="text-center">
                <p className="text-sm text-slate-500">Scan with mobile wallet</p>
                <p className="text-xs text-slate-400 mt-1">Invoice: {invoice.invoiceNumber}</p>
              </div>
            </div>

            {/* Info Badge */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-amber-600">ℹ️</span>
              <p className="text-xs text-amber-800">
                This payment is secured by smart contract. Your invoice will be automatically marked as paid once the transaction is confirmed.
              </p>
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

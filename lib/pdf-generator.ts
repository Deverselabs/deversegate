import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export type InvoiceForPDF = {
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  dueDate: string;
  paymentAddress: string | null;
  clientName: string;
  clientEmail: string;
  clientWallet?: string | null;
  // 🆕 NEW FIELDS
  paymentPageUrl?: string | null;
  merchantWallet?: string | null;
};

// Only 2 colors: Black and Light Gray
const BLACK = { r: 0, g: 0, b: 0 };
const LIGHT_GRAY = { r: 102, g: 102, b: 102 }; // #666666

const MARGIN_MM = 20;
const PAGE_WIDTH_MM = 210; // A4
const CONTENT_WIDTH = PAGE_WIDTH_MM - MARGIN_MM * 2;
const LINE_HEIGHT = 6;
const SECTION_GAP = 10;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount.replace(/,/g, ''));
  if (isNaN(num)) return amount;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generate a simple, clean invoice PDF.
 * Returns a Blob for download or attachment.
 */
export async function generateInvoicePDF(invoice: InvoiceForPDF): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = MARGIN_MM;

  const today = formatDate(new Date().toISOString());
  const dueDate = formatDate(invoice.dueDate);
  const amountFormatted = formatAmount(invoice.amount);
  const currency = (invoice.currency || 'USDC').toUpperCase();

  const setBlack = () => doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  const setGray = () => doc.setTextColor(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b);
  const setDrawGray = () => doc.setDrawColor(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b);

  const thinLine = () => {
    doc.setLineWidth(0.2);
    setDrawGray();
    doc.line(MARGIN_MM, y, PAGE_WIDTH_MM - MARGIN_MM, y);
    y += SECTION_GAP;
  };

  // ─── 1. HEADER ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setBlack();
  doc.text('DEVERSEGATE', MARGIN_MM, y);
  doc.text('INVOICE', PAGE_WIDTH_MM - MARGIN_MM, y, { align: 'right' });
  y += LINE_HEIGHT;
  thinLine();

  // ─── 2. INVOICE INFO (two columns) ─────────────────────────────────────────
  const leftColX = MARGIN_MM;
  const rightColX = PAGE_WIDTH_MM - MARGIN_MM;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setGray();
  doc.text('Invoice Number:', leftColX, y);
  setBlack();
  doc.setFont('helvetica', 'bold'); // 🆕 Make invoice number bold
  doc.text(invoice.invoiceNumber, leftColX + 32, y);
  doc.setFont('helvetica', 'normal'); // 🆕 Reset to normal
  y += LINE_HEIGHT;
  setGray();
  doc.text('Issue Date:', leftColX, y);
  setBlack();
  doc.text(today, leftColX + 32, y);
  y += LINE_HEIGHT;
  setGray();
  doc.text('Due Date:', leftColX, y);
  setBlack();
  doc.text(dueDate, leftColX + 32, y);

  // Right column: Status, Amount (label above value each)
  let rightY = y - LINE_HEIGHT * 3;
  setGray();
  doc.setFontSize(8);
  doc.text('Status:', rightColX, rightY, { align: 'right' });
  setBlack();
  doc.setFontSize(10);
  doc.text(invoice.status, rightColX, rightY + LINE_HEIGHT, { align: 'right' });
  rightY += LINE_HEIGHT * 2 + 2;
  setGray();
  doc.setFontSize(8);
  doc.text('Amount:', rightColX, rightY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  setBlack();
  doc.text(`${amountFormatted} ${currency}`, rightColX, rightY + LINE_HEIGHT, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  y += LINE_HEIGHT + 4;
  thinLine();

  // ─── 3. BILL TO ───────────────────────────────────────────────────────────
  doc.setFontSize(8);
  setGray();
  doc.text('Bill To:', MARGIN_MM, y);
  y += LINE_HEIGHT;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setBlack();
  doc.text(invoice.clientName, MARGIN_MM, y);
  y += LINE_HEIGHT;
  doc.setFont('helvetica', 'normal');
  setGray();
  doc.text(invoice.clientEmail, MARGIN_MM, y);
  y += SECTION_GAP;
  thinLine();

  // ─── 4. DESCRIPTION ────────────────────────────────────────────────────────
  doc.setFontSize(8);
  setGray();
  doc.text('Description:', MARGIN_MM, y);
  y += LINE_HEIGHT;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setBlack();
  const descLines = doc.splitTextToSize(invoice.description || '—', CONTENT_WIDTH);
  doc.text(descLines, MARGIN_MM, y);
  y += descLines.length * LINE_HEIGHT + SECTION_GAP;
  thinLine();

  // ─── 5. PAYMENT SECTION ───────────────────────────────────────────────────
  const centerX = PAGE_WIDTH_MM / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setBlack();
  doc.text('Payment Instructions', centerX, y, { align: 'center' });
  y += LINE_HEIGHT * 2;
  
  // 🆕 CHANGED: Show payment page URL instead of wallet address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Scan QR code or visit:', centerX, y, { align: 'center' });
  y += LINE_HEIGHT;
  
  // 🆕 Show payment page URL
  const paymentUrl = invoice.paymentPageUrl || `Payment page not generated`;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  setBlack();
  const urlLines = doc.splitTextToSize(paymentUrl, CONTENT_WIDTH - 10);
  doc.text(urlLines, centerX, y, { align: 'center' });
  y += urlLines.length * LINE_HEIGHT + LINE_HEIGHT;

  // 🆕 CHANGED: QR Code now points to payment page
  const qrSizeMm = 42;
  const qrX = centerX - qrSizeMm / 2;
  const qrY = y;
  
  if (invoice.paymentPageUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(invoice.paymentPageUrl, {
        width: 256,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSizeMm, qrSizeMm);
    } catch (err) {
      console.error('QR generation failed:', err);
      // Show error message instead
      doc.setFontSize(8);
      setGray();
      doc.text('QR code generation failed', centerX, qrY + 20, { align: 'center' });
    }
  } else {
    // No payment URL - show message
    doc.setFontSize(8);
    setGray();
    doc.text('Payment URL not available', centerX, qrY + 20, { align: 'center' });
  }
  
  y += qrSizeMm + 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setGray();
  doc.text('Scan to pay securely', centerX, y, { align: 'center' });
  y += LINE_HEIGHT;
  
  // 🆕 Also show invoice number below QR for reference
  doc.setFontSize(7);
  setGray();
  doc.text(`Invoice: ${invoice.invoiceNumber}`, centerX, y, { align: 'center' });
  y += SECTION_GAP * 2;

  // ─── 6. FOOTER ─────────────────────────────────────────────────────────────
  const footerY = pageHeight - 20;
  doc.setLineWidth(0.2);
  setDrawGray();
  doc.line(MARGIN_MM, footerY - 12, PAGE_WIDTH_MM - MARGIN_MM, footerY - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  setBlack();
  doc.text('Thank you!', centerX, footerY - 4, { align: 'center' });
  doc.setFontSize(8);
  setGray();
  doc.text('Powered by DeverseGate', centerX, footerY + 2, { align: 'center' });

  return doc.output('blob') as Blob;
}
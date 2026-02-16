import { Resend } from 'resend';
import { generateInvoiceEmailHTML } from './email-template';
import { generateInvoicePDF } from './pdf-generator';

const resend = new Resend(process.env.RESEND_API_KEY);

export type InvoiceForEmail = {
  invoiceNumber: string;
  amount: string;
  currency: string;
  clientName: string;
  clientEmail: string;
  description: string;
  dueDate: string;
  paymentAddress: string | null;
  status?: string;
  clientWallet?: string | null;
};

export type SendInvoiceEmailResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

/**
 * Sends an invoice email to the client and CC's the current user.
 */
export async function sendInvoiceEmail(
  invoice: InvoiceForEmail,
  userEmail: string
): Promise<SendInvoiceEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY is not configured' };
  }

  try {
    const subject = `Invoice ${invoice.invoiceNumber} - ${invoice.amount} ${invoice.currency} Due ${new Date(invoice.dueDate).toLocaleDateString()}`;
    const html = generateInvoiceEmailHTML(invoice);

    const pdfBlob = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status ?? 'PENDING',
      description: invoice.description,
      dueDate: invoice.dueDate,
      paymentAddress: invoice.paymentAddress,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientWallet: invoice.clientWallet ?? null,
    });
    const pdfBase64 = Buffer.from(await pdfBlob.arrayBuffer()).toString('base64');

    const { data, error } = await resend.emails.send({
      from: 'invoices@deverselabs.io',
      to: invoice.clientEmail,
      cc: userEmail,
      subject,
      html,
      attachments: [
        {
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error('Resend send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id ?? '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    console.error('sendInvoiceEmail error:', err);
    return { success: false, error: message };
  }
}

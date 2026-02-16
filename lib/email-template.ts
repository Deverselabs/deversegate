export type InvoiceForEmail = {
  invoiceNumber: string;
  amount: string;
  currency: string;
  clientName: string;
  clientEmail: string;
  description: string;
  dueDate: string;
  paymentAddress: string | null;
};

/**
 * Generates a professional HTML email body for an invoice.
 * Uses tables for layout and inline CSS for email client compatibility.
 */
export function generateInvoiceEmailHTML(invoice: InvoiceForEmail): string {
  const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString(
    undefined,
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 24px 28px; background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); border-radius: 12px 12px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">DeverseGate</h1>
                    <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">Crypto Invoicing</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 28px 24px; background-color: #ffffff; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;">
              <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #18181b;">New Invoice</h2>
              <p style="margin: 0 0 24px; font-size: 15px; color: #71717a; line-height: 1.5;">You have received an invoice. Details below.</p>

              <!-- Invoice details table -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Invoice #</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 14px; color: #18181b; text-align: right;">${escapeHtml(invoice.invoiceNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Amount</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 14px; color: #18181b; text-align: right; font-weight: 600;">${escapeHtml(invoice.amount)} ${escapeHtml(invoice.currency)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Client</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 14px; color: #18181b; text-align: right;">${escapeHtml(invoice.clientName)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Due Date</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; font-size: 14px; color: #18181b; text-align: right;">${escapeHtml(dueDateFormatted)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Description</td>
                  <td style="padding: 10px 0; font-size: 14px; color: #18181b; text-align: right;">${escapeHtml(invoice.description)}</td>
                </tr>
              </table>

              ${
                invoice.paymentAddress
                  ? `
              <!-- Payment instructions -->
              <div style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">Payment Instructions</p>
                <p style="margin: 0; font-size: 13px; font-family: ui-monospace, 'SF Mono', Monaco, monospace; color: #18181b; word-break: break-all;">${escapeHtml(invoice.paymentAddress)}</p>
                <p style="margin: 8px 0 0; font-size: 12px; color: #78350f;">Send exactly <strong>${escapeHtml(invoice.amount)} ${escapeHtml(invoice.currency)}</strong> to the address above.</p>
              </div>
              `
                  : ''
              }
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #fafafa; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">Powered by DeverseGate</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (c) => map[c] ?? c);
}

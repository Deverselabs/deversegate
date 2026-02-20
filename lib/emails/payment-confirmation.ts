export function getPaymentConfirmationEmail(
  invoiceNumber: string,
  amount: string,
  currency: string,
  clientName: string,
  txHash: string,
  network: string
) {
  return {
    subject: `✅ Payment Confirmed - Invoice ${invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Payment Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your payment has been successfully processed</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Hello ${clientName},
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              We've received your payment and your invoice has been marked as paid. Thank you for your prompt payment!
            </p>
            
            <!-- Invoice Details Box -->
            <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 0 0 30px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600; font-family: monospace;">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Paid:</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600; font-size: 18px;">${amount} ${currency}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Network:</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${network.charAt(0).toUpperCase() + network.slice(1)}</td>
                </tr>
              </table>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 0 0 30px 0;">
              <a href="https://${network}.etherscan.io/tx/${txHash}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Transaction on Etherscan
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
              This payment was secured by blockchain smart contract technology. Your transaction is immutable and publicly verifiable.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
              Powered by DeverseGate
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
              Secure blockchain-powered invoicing
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `,
  };
}

export function getMerchantPaymentNotificationEmail(
  invoiceNumber: string,
  amount: string,
  currency: string,
  clientName: string,
  txHash: string,
  network: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return {
    subject: `💰 Payment Received - Invoice ${invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💰 Payment Received!</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Great news! You've received a payment for invoice <strong>${invoiceNumber}</strong>.
            </p>
            
            <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 24px; margin: 0 0 30px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #166534; font-size: 14px;">Amount Received:</td>
                  <td style="padding: 8px 0; text-align: right; color: #166534; font-weight: 700; font-size: 20px;">${amount} ${currency}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #166534; font-size: 14px;">From:</td>
                  <td style="padding: 8px 0; text-align: right; color: #166534; font-weight: 600;">${clientName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #166534; font-size: 14px;">Invoice:</td>
                  <td style="padding: 8px 0; text-align: right; color: #166534; font-weight: 600; font-family: monospace;">${invoiceNumber}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center;">
              <a href="https://${network}.etherscan.io/tx/${txHash}" 
                 style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                View Transaction
              </a>
              <a href="${appUrl}/dashboard/invoices" 
                 style="display: inline-block; background: #6b7280; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Powered by DeverseGate</p>
          </div>
          
        </div>
      </body>
      </html>
    `,
  };
}

import { Resend } from 'resend';
import { Order } from '@/lib/commerce/types';

// Fallback to avoid breaking in environments where RESEND_API_KEY is not set
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

/**
 * Format currency to NGN
 */
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Send an Order Confirmation email via Resend
 */
export async function sendOrderConfirmationEmail(order: Order, customerEmail: string, customerName: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EmailService] RESEND_API_KEY not set. Mocking email dispatch.');
    return;
  }

  const subject = `Order Confirmed: ${order.id.split('-')[0].toUpperCase()} - McDaves Eyewear`;

  // Construct a beautiful HTML template
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #171717; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">McDaves</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Hello ${customerName},</h2>
        <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          Thank you for choosing McDaves! We've successfully received your order and payment. Your eyewear is now being prepared for dispatch.
        </p>

        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Order ID:</strong> ${order.id}</p>
          <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 600;">Confirmed & Paid</span></p>
        </div>

        <h3 style="font-size: 16px; font-weight: 600; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; margin-bottom: 16px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tbody>
            ${order.items.map((item) => `
              <tr>
                <td style="padding: 8px 0; font-size: 14px;">${item.productName || (item as any).name || 'Eyewear Frame'} x ${item.quantity}</td>
                <td style="padding: 8px 0; font-size: 14px; text-align: right;">${formatCurrency(item.unitPrice * item.quantity)}</td>
              </tr>
            `).join('')}
            <tr>
              <td style="padding: 8px 0; font-size: 14px;">Delivery Fee</td>
              <td style="padding: 8px 0; font-size: 14px; text-align: right;">${formatCurrency(order.shippingFee ?? 0)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 16px 0 0 0; font-size: 16px; font-weight: 700; border-top: 1px solid #e5e5e5;">Total</td>
              <td style="padding: 16px 0 0 0; font-size: 16px; font-weight: 700; text-align: right; border-top: 1px solid #e5e5e5;">${formatCurrency(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        <p style="font-size: 14px; line-height: 24px; color: #475569;">
          You can track your order status by visiting the <a href="https://mcdaves.com/account/login" style="color: #0f172a; font-weight: 600;">Customer Portal</a>.
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="font-size: 12px; color: #64748b; margin: 0;">
          Need help? Reply to this email or contact us via WhatsApp at +234 815 234 6649
        </p>
        <p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">
          &copy; ${new Date().getFullYear()} McDaves Eyewear. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'McDaves Orders <orders@mcdaves.com>',
      to: customerEmail,
      subject,
      html,
    });

    if (error) {
      console.error('[EmailService] Failed to send order confirmation:', error);
    } else {
      console.log(`[EmailService] Order confirmation sent to ${customerEmail}. ID:`, data?.id);
    }
  } catch (err) {
    console.error('[EmailService] Unexpected error sending email:', err);
  }
}

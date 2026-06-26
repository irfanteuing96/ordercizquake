import axios from 'axios';

/**
 * Clean and format phone number to international format (628xxx) for WA compatibility
 * @param {string} num 
 * @returns {string}
 */
function formatPhoneNumber(num) {
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Format comma-separated phone numbers
 * @param {string} phones 
 * @returns {string}
 */
function formatMultiplePhones(phones) {
  if (!phones) return '';
  return phones.split(',')
    .map(p => formatPhoneNumber(p.trim()))
    .filter(Boolean)
    .join(',');
}

/**
 * Sends a WhatsApp message using Fonnte API or logs to console if in mock mode
 * @param {string} target - WhatsApp number(s) (comma-separated for multiple)
 * @param {string} message - Message text
 */
export async function sendWhatsAppMessage(target, message) {
  const token = process.env.FONNTE_API_TOKEN;
  const isMock = !token || token.includes('YOUR_FONNTE_TOKEN') || process.env.WHATSAPP_MOCK === 'true';

  const formattedTarget = formatMultiplePhones(target);

  if (isMock) {
    console.log(`\n========================================`);
    console.log(`[WhatsApp Mock] Sending message to: ${formattedTarget || target}`);
    console.log(`Message:\n${message}`);
    console.log(`========================================\n`);
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post('https://api.fonnte.com/send', {
      target: formattedTarget,
      message: message,
    }, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    console.log(`[WhatsApp Service] Response for ${formattedTarget}:`, response.data);
    return { success: response.data.status === true, response: response.data };
  } catch (error) {
    console.error(`[WhatsApp Service] Error sending to ${formattedTarget}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends notifications for a paid order to the customer and admins
 * @param {object} order - The order object
 */
export async function sendOrderPaidNotifications(order) {
  try {
    // 1. Prepare item list message
    const itemsText = order.items.map(item => `- ${item.name} x${item.quantity} (Rp ${item.price.toLocaleString('id-ID')})`).join('\n');
    
    // 2. Notify Customer
    const customerMessage = `Halo ${order.customer.name},\n\nTerima kasih telah memesan di Cizquake! 😊\n\nPembayaran untuk pesanan Anda #${order.orderId} sebesar *Rp ${order.grossAmount.toLocaleString('id-ID')}* telah kami terima.\n\n*Detail Pesanan:*\n${itemsText}\n\n*Detail Pengiriman:*\n- Alamat: ${order.shipping.address}\n- Kurir: ${order.shipping.courierCompany.toUpperCase()} ${order.shipping.courierService}\n- Status Pengantaran: Sedang diproses / Menunggu kurir\n\nAnda dapat memantau status pengiriman secara real-time di website Cizquake.\n\nSelamat menikmati! 🍰✨`;
    
    await sendWhatsAppMessage(order.customer.phone, customerMessage);

    // 3. Notify Admins
    const adminNumbers = process.env.ADMIN_WA_NUMBERS || '';
    if (adminNumbers) {
      const adminMessage = `🔔 *PESANAN BARU MASUK (SUDAH BAYAR)*\n\n- *Order ID:* #${order.orderId}\n- *Customer:* ${order.customer.name} (${order.customer.phone})\n- *Total Pembayaran:* *Rp ${order.grossAmount.toLocaleString('id-ID')}*\n\n*Daftar Kue yang Harus Disiapkan:*\n${itemsText}\n\n*Pengiriman:*\n- Alamat: ${order.shipping.address}\n- Kurir: ${order.shipping.courierCompany.toUpperCase()} ${order.shipping.courierService}\n\nMohon segera siapkan pesanan! 🍰`;
      
      await sendWhatsAppMessage(adminNumbers, adminMessage);
    } else {
      console.log('[WhatsApp Service] Admin notification skipped (no custom ADMIN_WA_NUMBERS configured in .env).');
    }
  } catch (err) {
    console.error('[WhatsApp Service] Failed to send notifications:', err.message);
  }
}

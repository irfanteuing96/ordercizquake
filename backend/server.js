import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import midtransClient from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';
import { sendOrderPaidNotifications } from './whatsappService.js';


// Load Environment Variables
dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Midtrans & Biteship Clients
const isMockMidtrans = !process.env.MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY.includes('YOUR_SANDBOX');
const isMockBiteship = !process.env.BITESHIP_API_KEY || process.env.BITESHIP_API_KEY.includes('YOUR_SANDBOX');

let midtransCoreApi = null;
if (!isMockMidtrans) {
  midtransCoreApi = new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });
}

// Initialize Supabase Client (if keys are provided)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const isUseSupabase = supabaseUrl && supabaseKey && 
                     !supabaseUrl.includes('placeholder') && 
                     !supabaseKey.includes('placeholder') && 
                     supabaseUrl !== '' && 
                     supabaseKey !== '';

let supabase = null;
if (isUseSupabase) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[Supabase] Database connected. Transactions will be saved permanently.');
} else {
  console.log('[Supabase] No credentials found or incomplete. Falling back to local orders.json database.');
}

// Database Helpers (JSON-based order persistence)
const readOrders = () => {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading orders file:', error);
    return [];
  }
};

const writeOrders = (orders) => {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error writing orders file:', error);
  }
};

// Database Helpers (Fallback JSON + Supabase PostgreSQL)
const getOrderById = async (orderId) => {
  if (isUseSupabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      return {
        orderId: data.order_id,
        customer: {
          name: data.customer_name,
          phone: data.customer_phone
        },
        items: data.items,
        shipping: {
          address: data.shipping_address,
          latitude: parseFloat(data.shipping_latitude),
          longitude: parseFloat(data.shipping_longitude),
          courierCompany: data.courier_company,
          courierService: data.courier_service
        },
        totalProductPrice: parseFloat(data.total_product_price),
        shippingPrice: parseFloat(data.shipping_price),
        grossAmount: parseFloat(data.gross_amount),
        paymentStatus: data.payment_status,
        shippingStatus: data.shipping_status,
        shippingOrderInfo: data.shipping_order_info,
        paymentQrUrl: data.payment_qr_url,
        paymentExpiry: data.payment_expiry,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('[Supabase] Error getting order:', error.message);
      return null;
    }
  } else {
    const orders = readOrders();
    return orders.find(o => o.orderId === orderId) || null;
  }
};

const createOrder = async (order) => {
  if (isUseSupabase) {
    try {
      const dbOrder = {
        order_id: order.orderId,
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        items: order.items,
        shipping_address: order.shipping.address,
        shipping_latitude: order.shipping.latitude,
        shipping_longitude: order.shipping.longitude,
        courier_company: order.shipping.courierCompany,
        courier_service: order.shipping.courierService,
        total_product_price: order.totalProductPrice,
        shipping_price: order.shippingPrice,
        gross_amount: order.grossAmount,
        payment_status: order.paymentStatus || 'pending',
        shipping_status: order.shippingStatus || 'idle',
        shipping_order_info: order.shippingOrderInfo,
        payment_qr_url: order.paymentQrUrl,
        payment_expiry: order.paymentExpiry,
        created_at: order.createdAt || new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .insert(dbOrder);
      
      if (error) throw error;
      console.log(`[Supabase] Success inserting order: ${order.orderId}`);
      return true;
    } catch (error) {
      console.error('[Supabase] Error inserting order:', error.message);
      return false;
    }
  } else {
    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);
    return true;
  }
};

const updateOrderFields = async (orderId, fields) => {
  if (isUseSupabase) {
    try {
      const dbUpdates = {};
      if (fields.paymentStatus !== undefined) dbUpdates.payment_status = fields.paymentStatus;
      if (fields.shippingStatus !== undefined) dbUpdates.shipping_status = fields.shippingStatus;
      if (fields.shippingOrderInfo !== undefined) dbUpdates.shipping_order_info = fields.shippingOrderInfo;
      if (fields.paymentQrUrl !== undefined) dbUpdates.payment_qr_url = fields.paymentQrUrl;
      if (fields.paymentExpiry !== undefined) dbUpdates.payment_expiry = fields.paymentExpiry;
      
      const { error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('order_id', orderId);
      
      if (error) throw error;
      console.log(`[Supabase] Success updating order: ${orderId}`);
      return true;
    } catch (error) {
      console.error('[Supabase] Error updating order:', error.message);
      return false;
    }
  } else {
    const orders = readOrders();
    const idx = orders.findIndex(o => o.orderId === orderId);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...fields };
      writeOrders(orders);
      return true;
    }
    return false;
  }
};

// -----------------
// ENDPOINT 1: SEARCH AREA (BITESHIP MAPS)
// -----------------
app.get('/api/shipping/areas', async (req, res) => {
  const query = req.query.q || '';
  if (!query || query.length < 3) {
    return res.json({ success: true, areas: [] });
  }

  if (isMockBiteship) {
    console.log(`[BiteShip Mock] Searching area for: "${query}"`);
    // Mock standard districts/areas in Bandung
    const mockAreas = [
      { id: 'ID_AREA_1', name: 'Buahbatu, Kota Bandung', postal_code: '40287', latitude: -6.9554, longitude: 107.6588 },
      { id: 'ID_AREA_2', name: 'Cijaura, Buahbatu, Kota Bandung', postal_code: '40287', latitude: -6.9582, longitude: 107.6612 },
      { id: 'ID_AREA_3', name: 'Lengkong, Kota Bandung', postal_code: '40263', latitude: -6.9284, longitude: 107.6234 },
      { id: 'ID_AREA_4', name: 'Cicadas, Cibeunying Kidul, Kota Bandung', postal_code: '40121', latitude: -6.9042, longitude: 107.6432 },
      { id: 'ID_AREA_5', name: 'Coblong, Kota Bandung', postal_code: '40135', latitude: -6.8872, longitude: 107.6152 }
    ].filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
    return res.json({ success: true, areas: mockAreas });
  }

  try {
    // Query Photon API (OpenStreetMap-based autocomplete with prefix support)
    // Bounded to Bandung Raya (Greater Bandung) bounding box to include areas like Baleendah, Soreang, Lembang, Jatinangor, etc.
    const response = await axios.get('https://photon.komoot.io/api/', {
      params: {
        q: query,
        limit: 8,
        bbox: '107.35,-7.15,107.90,-6.70'
      }
    });


    // Map Photon GeoJSON features to the schema expected by the frontend
    const areas = response.data.features.map((feature, idx) => {
      const p = feature.properties;
      const coords = feature.geometry.coordinates; // [longitude, latitude] in GeoJSON

      // Build a clean readable address name
      const nameParts = [p.name];
      if (p.locality && p.locality !== p.name) nameParts.push(p.locality);
      if (p.district && p.district !== p.locality) nameParts.push(p.district);
      nameParts.push(p.city || 'Bandung');
      const cleanName = nameParts.filter(Boolean).join(', ');

      return {
        id: p.osm_id ? `OSM-${p.osm_type}-${p.osm_id}` : `PH-${idx}-${Date.now()}`,
        name: cleanName,
        postal_code: p.postcode || '40000',
        latitude: parseFloat(coords[1]), // Latitude is index 1
        longitude: parseFloat(coords[0]) // Longitude is index 0
      };
    });

    res.json({ success: true, areas });
  } catch (error) {
    console.warn('Photon autocomplete failed, falling back to Biteship Areas. Reason:', error.message);
    try {
      const response = await axios.get(`https://api.biteship.com/v1/maps/areas`, {
        params: { countries: 'ID', input: query },
        headers: { 'Authorization': `Bearer ${process.env.BITESHIP_API_KEY}` }
      });
      res.json({ success: true, areas: response.data.areas });
    } catch (err) {
      console.error('Error searching areas from BiteShip fallback:', err.message);
      res.status(500).json({ success: false, error: 'Gagal mencari area alamat' });
    }
  }
});

// -----------------
// ENDPOINT 2: CALCULATE RATES
// -----------------
app.post('/api/shipping/rates', async (req, res) => {
  const { destination_latitude, destination_longitude, destination_area_id, items } = req.body;

  // Origin info from env
  const originLat = parseFloat(process.env.ORIGIN_LATITUDE || '-6.9554');
  const originLng = parseFloat(process.env.ORIGIN_LONGITUDE || '107.6588');

  if (isMockBiteship) {
    console.log('[BiteShip Mock] Calculating shipping rates...');
    // Hitung jarak sederhana antara origin dan destinasi
    let distance = 5.0; // default 5km
    if (destination_latitude && destination_longitude) {
      const latDiff = destination_latitude - originLat;
      const lngDiff = destination_longitude - originLng;
      // Formula jarak Euclidean kasar (dalam derajat, konversi ke km dgn kali 111)
      distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
      if (distance < 1) distance = 1.0;
    }

    // Hitung tarif instan kasar: Rp 2.500 per km + Rp 10.000 minimum
    const rateInstant = Math.round(10000 + distance * 2500);
    const rateSameDay = Math.round(7000 + distance * 1200);

    const mockRates = [
      {
        company: 'gosend',
        courier_name: 'GoSend Instant',
        courier_code: 'gosend',
        courier_service_name: 'Instant',
        duration: '1 - 2 Jam',
        price: rateInstant
      },
      {
        company: 'grab',
        courier_name: 'GrabExpress Instant',
        courier_code: 'grab',
        courier_service_name: 'Instant',
        duration: '1 - 2 Jam',
        price: rateInstant + 500 // sedikit beda
      },
      {
        company: 'gosend',
        courier_name: 'GoSend Same Day',
        courier_code: 'gosend',
        courier_service_name: 'Same Day',
        duration: '6 - 8 Jam',
        price: Math.max(15000, rateSameDay)
      }
    ];

    return res.json({ success: true, rates: mockRates, distance: parseFloat(distance.toFixed(2)) });
  }

  try {
    // Biteship API rates
    const payload = {
      origin_latitude: originLat,
      origin_longitude: originLng,
      destination_latitude: parseFloat(destination_latitude),
      destination_longitude: parseFloat(destination_longitude),
      couriers: 'gosend,grab',
      items: items.map(item => ({
        name: item.name,
        value: item.price * item.quantity,
        weight: item.weight || 200,
        quantity: item.quantity
      }))
    };

    const response = await axios.post(`https://api.biteship.com/v1/rates/couriers`, payload, {
      headers: { 
        'Authorization': `Bearer ${process.env.BITESHIP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Format output Biteship ke struktur sederhana
    const rates = response.data.pricing.map(price => ({
      company: price.company,
      courier_name: `${price.courier_name} (${price.courier_service})`,
      courier_code: price.courier_code,
      courier_service_name: price.courier_service,
      duration: price.duration,
      price: price.price
    }));

    res.json({ success: true, rates });
  } catch (error) {
    console.warn('Real BiteShip rates calculation failed. Falling back to Mock Rates. Reason:', error.message);
    
    // Fallback hitung jarak sederhana antara origin dan destinasi
    let distance = 5.0; 
    if (destination_latitude && destination_longitude) {
      const latDiff = destination_latitude - originLat;
      const lngDiff = destination_longitude - originLng;
      distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
      if (distance < 1) distance = 1.0;
    }

    const rateInstant = Math.round(10000 + distance * 2500);
    const mockRates = [
      {
        company: 'gosend',
        courier_name: 'GoSend Instant (Mock)',
        courier_code: 'gosend',
        courier_service_name: 'Instant',
        duration: '1 - 2 Jam',
        price: rateInstant
      },
      {
        company: 'grab',
        courier_name: 'GrabExpress Instant (Mock)',
        courier_code: 'grab',
        courier_service_name: 'Instant',
        duration: '1 - 2 Jam',
        price: rateInstant + 500
      }
    ];

    res.json({ 
      success: true, 
      rates: mockRates, 
      distance: parseFloat(distance.toFixed(2)),
      warning: 'BiteShip API error. Menggunakan estimasi tarif lokal.' 
    });
  }
});

// -----------------
// ENDPOINT 3: CHECKOUT & CREATE PAYMENT
// -----------------
app.post('/api/checkout', async (req, res) => {
  const { customer, items, shipping, totalProductPrice, shippingPrice } = req.body;
  
  const orderId = `CIZ-${Date.now()}`;
  const grossAmount = totalProductPrice + shippingPrice;

  // 1. Buat pesanan di database
  const newOrder = {
    orderId,
    customer,
    items,
    shipping,
    totalProductPrice,
    shippingPrice,
    grossAmount,
    paymentStatus: 'pending', // pending, paid, expired, failed
    shippingStatus: 'idle',  // idle, searching, booking_failed, driver_assigned, on_the_way, delivered
    shippingOrderInfo: null, // response dari Biteship
    createdAt: new Date().toISOString()
  };

  await createOrder(newOrder);

  // 2. Buat pembayaran QRIS di Midtrans
  if (isMockMidtrans) {
    console.log(`[Midtrans Mock] Generating QRIS for Order ID: ${orderId}, Amount: Rp ${grossAmount}`);
    // Simulasikan kembalian QRIS. Kita gunakan QR Code URL simulator
    const qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Cizquake-Payment-Simulator-${orderId}-${grossAmount}`;
    
    // update order dengan QR info
    newOrder.paymentQrUrl = qrisUrl;
    newOrder.paymentExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 menit exp
    
    await updateOrderFields(orderId, {
      paymentQrUrl: qrisUrl,
      paymentExpiry: newOrder.paymentExpiry
    });

    return res.json({
      success: true,
      orderId,
      grossAmount,
      paymentType: 'qris_mock',
      paymentQrUrl: qrisUrl,
      expiryTime: newOrder.paymentExpiry
    });
  }

  try {
    const transactionDetails = {
      payment_type: 'qris',
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      qris: {
        acquirer: 'gopay' // Standard dynamic QRIS di Midtrans
      },
      customer_details: {
        first_name: customer.name,
        phone: customer.phone,
        email: customer.email || 'customer@cizquake.com'
      }
    };

    const chargeResponse = await midtransCoreApi.charge(transactionDetails);
    
    // QRIS URL ada di actions[0] atau actions[1] yang namanya "generate-qr-code"
    const qrAction = chargeResponse.actions.find(act => act.name === 'generate-qr-code');
    const paymentQrUrl = qrAction ? qrAction.url : '';

    // Update order dengan data Midtrans
    newOrder.paymentQrUrl = paymentQrUrl;
    newOrder.paymentExpiry = chargeResponse.expiry_time || new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    await updateOrderFields(orderId, {
      paymentQrUrl,
      paymentExpiry: newOrder.paymentExpiry
    });

    res.json({
      success: true,
      orderId,
      grossAmount,
      paymentType: 'qris',
      paymentQrUrl,
      expiryTime: newOrder.paymentExpiry
    });
  } catch (error) {
    console.warn('Real Midtrans API failed. Falling back to Mock QRIS. Reason:', error.message);
    
    // Fallback ke Mock QRIS agar aplikasi tidak macet saat testing
    const qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Cizquake-Payment-Simulator-${orderId}-${grossAmount}`;
    
    newOrder.paymentQrUrl = qrisUrl;
    newOrder.paymentExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    await updateOrderFields(orderId, {
      paymentQrUrl: qrisUrl,
      paymentExpiry: newOrder.paymentExpiry
    });

    res.json({
      success: true,
      orderId,
      grossAmount,
      paymentType: 'qris_mock_fallback',
      paymentQrUrl: qrisUrl,
      expiryTime: newOrder.paymentExpiry,
      warning: 'Midtrans API error. Sistem otomatis beralih ke QRIS simulator.'
    });
  }
});

// Helper untuk men-trigger booking kurir otomatis di BiteShip
async function bookCourierAutomatically(order) {
  console.log(`[BiteShip] Memicu pemesanan kurir otomatis untuk order: ${order.orderId}`);
  await updateOrderFields(order.orderId, { shippingStatus: 'searching' });

  if (isMockBiteship) {
    // Simulasi booking kurir berhasil setelah 3 detik
    setTimeout(async () => {
      const currentOrder = await getOrderById(order.orderId);
      if (currentOrder) {
        await updateOrderFields(order.orderId, {
          shippingStatus: 'driver_assigned',
          shippingOrderInfo: {
            courier_order_id: `BITESHIP-${Date.now()}`,
            courier_driver_name: 'Budi Santoso (GoSend)',
            courier_driver_phone: '085566778899',
            courier_tracking_url: 'https://biteship.com/tracking/mock'
          }
        });
        console.log(`[BiteShip Mock] Driver assigned untuk ${order.orderId}: Budi Santoso`);

        // Simulasikan status jalan dan selesai pengiriman bertahap
        setTimeout(async () => {
          await updateOrderFields(order.orderId, { shippingStatus: 'on_the_way' });
          console.log(`[BiteShip Mock] Order ${order.orderId} sedang di perjalanan.`);
        }, 10000);

        setTimeout(async () => {
          await updateOrderFields(order.orderId, { shippingStatus: 'delivered' });
          console.log(`[BiteShip Mock] Order ${order.orderId} telah sampai.`);
        }, 25000);
      }
    }, 3000);
    return;
  }

  try {
    // Panggil API BiteShip untuk booking
    const originLat = parseFloat(process.env.ORIGIN_LATITUDE || '-6.9554');
    const originLng = parseFloat(process.env.ORIGIN_LONGITUDE || '107.6588');

    const payload = {
      shipper: {
        name: process.env.ORIGIN_CONTACT_NAME || "Cizquake Bandung",
        phone: process.env.ORIGIN_CONTACT_PHONE || "08123456789",
        email: "cizquake@gmail.com",
        organization: "Cizquake"
      },
      origin: {
        name: process.env.ORIGIN_CONTACT_NAME || "Cizquake Bandung",
        phone: process.env.ORIGIN_CONTACT_PHONE || "08123456789",
        address: process.env.ORIGIN_ADDRESS,
        latitude: originLat,
        longitude: originLng
      },
      destination: {
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.shipping.address,
        latitude: parseFloat(order.shipping.latitude),
        longitude: parseFloat(order.shipping.longitude)
      },
      courier: {
        company: order.shipping.courierCompany, // e.g. 'gosend'
        type: order.shipping.courierService    // e.g. 'instant'
      },
      items: order.items.map(item => ({
        name: item.name,
        value: item.price * item.quantity,
        weight: item.weight || 200,
        quantity: item.quantity
      }))
    };

    const response = await axios.post('https://api.biteship.com/v1/orders', payload, {
      headers: {
        'Authorization': `Bearer ${process.env.BITESHIP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const biteshipOrder = response.data;
    await updateOrderFields(order.orderId, {
      shippingStatus: 'driver_assigned',
      shippingOrderInfo: {
        courier_order_id: biteshipOrder.id,
        courier_driver_name: biteshipOrder.courier?.driver_name || 'Mencari Kurir...',
        courier_driver_phone: biteshipOrder.courier?.driver_phone || '',
        courier_tracking_url: biteshipOrder.courier?.tracking_url || ''
      }
    });
  } catch (error) {
    console.warn('Real BiteShip courier booking failed. Falling back to Mock Booking. Reason:', error.message);
    
    // Fallback ke booking simulasi agar tracking tetap berjalan di UI
    await updateOrderFields(order.orderId, {
      shippingStatus: 'driver_assigned',
      shippingOrderInfo: {
        courier_order_id: `BITESHIP-FALLBACK-${Date.now()}`,
        courier_driver_name: 'Budi Santoso (GoSend - Mock)',
        courier_driver_phone: '085566778899',
        courier_tracking_url: 'https://biteship.com/tracking/mock'
      }
    });
    
    // Simulasikan status jalan dan selesai pengiriman bertahap
    setTimeout(async () => {
      await updateOrderFields(order.orderId, { shippingStatus: 'on_the_way' });
      console.log(`[BiteShip Fallback Mock] Order ${order.orderId} sedang di perjalanan.`);
    }, 10000);

    setTimeout(async () => {
      await updateOrderFields(order.orderId, { shippingStatus: 'delivered' });
      console.log(`[BiteShip Fallback Mock] Order ${order.orderId} telah sampai.`);
    }, 25000);
  }
}

// -----------------
// ENDPOINT 4: MIDTRANS WEBHOOK / CALLBACK
// -----------------
app.post('/api/payment-callback', async (req, res) => {
  const notification = req.body;
  console.log('[Midtrans Webhook] Received status notification:', notification);

  const orderId = notification.order_id;
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Invalid payload: order_id is missing' });
  }

  const transactionStatus = notification.transaction_status;
  const fraudStatus = notification.fraud_status;

  const order = await getOrderById(orderId);

  if (!order) {
    console.log(`[Midtrans Webhook] Order ID ${orderId} not found (possibly a test request). Returning 200 to acknowledge.`);
    return res.status(200).json({ success: true, message: 'Notification received but order not found' });
  }

  let paymentStatus = 'pending';

  if (transactionStatus === 'capture') {
    if (fraudStatus === 'accept') {
      paymentStatus = 'paid';
    } else {
      paymentStatus = 'fraud';
    }
  } else if (transactionStatus === 'settlement') {
    paymentStatus = 'paid';
  } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
    paymentStatus = 'failed';
  } else if (transactionStatus === 'pending') {
    paymentStatus = 'pending';
  }

  await updateOrderFields(orderId, { paymentStatus });
  order.paymentStatus = paymentStatus;

  // Jika status pembayaran sukses, jalankan booking kurir otomatis dan kirim WA
  if (paymentStatus === 'paid' && order.shippingStatus === 'idle') {
    // Run async booking
    bookCourierAutomatically(order);
    // Kirim notifikasi WA ke customer dan admin
    sendOrderPaidNotifications(order);
  }

  res.json({ success: true });
});

// -----------------
// ENDPOINT 5: GET ORDER STATUS (TRACKING)
// -----------------
app.get('/api/order/:id', async (req, res) => {
  const { id } = req.params;
  const order = await getOrderById(id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }

  res.json({ success: true, order });
});

// -----------------
// ENDPOINT 6: SIMULATE PAYMENT (FOR TESTING SANDBOX & DEVELOPMENT)
// -----------------
app.post('/api/order/:id/simulate-pay', async (req, res) => {
  const { id } = req.params;
  const order = await getOrderById(id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
  }

  console.log(`[Developer Simulator] Simulating payment success for order: ${id}`);
  await updateOrderFields(id, { paymentStatus: 'paid' });
  order.paymentStatus = 'paid';

  // Trigger booking kurir otomatis dan kirim WA
  if (order.shippingStatus === 'idle') {
    bookCourierAutomatically(order);
    sendOrderPaidNotifications(order);
  }

  res.json({ success: true, message: 'Simulasi pembayaran sukses berhasil dipicu!', order });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Cizquake Auto-Order Backend running on port ${PORT}  `);
  console.log(`  Midtrans Mode: ${isMockMidtrans ? 'SIMULATOR (MOCK)' : 'REAL SANDBOX/PROD'}`);
  console.log(`  BiteShip Mode: ${isMockBiteship ? 'SIMULATOR (MOCK)' : 'REAL SANDBOX/PROD'}`);
  console.log(`=======================================================`);
});

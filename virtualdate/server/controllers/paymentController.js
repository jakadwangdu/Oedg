const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const LocalDb = require('../config/localDb');

// Helper to determine whether Mongo is active
const isMongoActive = () => mongoose.connection.readyState === 1;

/**
 * @desc    Create a YouPI-PG payment order for buying the website (4.5K INR)
 * @route   POST /api/payment/create-order
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { buyerPhone, buyerName, buyerEmail } = req.body;

    if (!buyerPhone || typeof buyerPhone !== 'string') {
      return res.status(400).json({ message: 'A valid phone number is required to transfer website ownership.' });
    }

    const cleanedPhone = buyerPhone.replace(/[^\d+]/g, '');
    if (cleanedPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile / WhatsApp number.' });
    }

    const orderId = `OEDG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const amount = 4500; // 4.5K INR
    const currency = 'INR';

    const upiVpa = process.env.YOUPI_UPI_VPA || 'jakadwangdu@upi';
    const payeeName = process.env.YOUPI_PAYEE_NAME || 'Oedg Platform';
    const note = `Oedg Website Transfer ${orderId}`;

    // Standard YouPI-PG / UPI Intent URL
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent(note)}`;

    // Deep link shortcuts for Indian UPI Apps
    const appLinks = {
      gpay: `tez://upi/pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent(note)}`,
      phonepe: `phonepe://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent(note)}`,
      paytm: `paytmmp://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent(note)}`,
      bhim: `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=${currency}&tn=${encodeURIComponent(note)}`,
    };

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute YouPI checkout window

    const orderData = {
      orderId,
      amount,
      currency,
      buyerPhone: cleanedPhone,
      buyerName: buyerName ? buyerName.trim().slice(0, 80) : '',
      buyerEmail: buyerEmail ? buyerEmail.trim().toLowerCase().slice(0, 100) : '',
      status: 'PENDING',
      transferStatus: 'PENDING_TRANSFER',
      upiVpa,
      paymentGateway: 'YouPI-PG',
      metadata: {
        item: 'Oedg Complete Website Source Code & Rights',
        notes: 'Transfer initiated upon payment receipt',
        expiresAt: expiresAt.toISOString(),
      },
    };

    if (isMongoActive()) {
      await Order.create(orderData);
    } else {
      LocalDb.createOrder(orderData);
    }

    console.log(`[YouPI-PG] Order Created: ${orderId} for ₹${amount} | Buyer Phone: ${cleanedPhone}`);

    // If upstream YouPI-PG instance is configured, we can also link to hosted checkout
    const youpiApiUrl = process.env.YOUPI_API_URL || '';
    const checkoutUrl = youpiApiUrl
      ? `${youpiApiUrl.replace(/\/$/, '')}/checkout/${orderId}`
      : null;

    res.status(201).json({
      success: true,
      orderId,
      amount,
      currency,
      buyerPhone: cleanedPhone,
      upiVpa,
      payeeName,
      upiIntentUrl,
      appLinks,
      checkoutUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[YouPI-PG] createPaymentOrder Error:', error);
    res.status(500).json({ message: 'Internal server error while initializing YouPI payment.' });
  }
};

/**
 * @desc    Get order payment status
 * @route   GET /api/payment/status/:orderId
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    let order = null;

    if (isMongoActive()) {
      order = await Order.findOne({ orderId });
    } else {
      order = LocalDb.findOrder(orderId);
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      buyerPhone: order.buyerPhone,
      transferStatus: order.transferStatus,
      utr: order.utr || null,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error('[YouPI-PG] getPaymentStatus Error:', error);
    res.status(500).json({ message: 'Failed to retrieve payment status.' });
  }
};

/**
 * @desc    Buyer submits UPI UTR reference number for verification
 * @route   POST /api/payment/verify-utr
 */
const verifyPaymentUtr = async (req, res) => {
  try {
    const { orderId, utr } = req.body;

    if (!orderId || !utr || typeof utr !== 'string') {
      return res.status(400).json({ message: 'Order ID and 12-digit UPI UTR are required.' });
    }

    const cleanUtr = utr.trim().replace(/\s+/g, '');
    if (cleanUtr.length < 6) {
      return res.status(400).json({ message: 'Please provide a valid UTR / Transaction Reference number.' });
    }

    let order = null;
    if (isMongoActive()) {
      order = await Order.findOne({ orderId });
    } else {
      order = LocalDb.findOrder(orderId);
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const updates = {
      status: 'SUCCESS',
      utr: cleanUtr,
      transferStatus: 'PENDING_TRANSFER',
      updatedAt: new Date(),
    };

    if (isMongoActive()) {
      await Order.updateOne({ orderId }, { $set: updates });
    } else {
      LocalDb.updateOrder(orderId, updates);
    }

    console.log(`\n======================================================`);
    console.log(`🎉 [OEDG WEBSITE PURCHASE VERIFIED via YouPI-PG]`);
    console.log(`Order ID:      ${orderId}`);
    console.log(`Amount:        ₹${order.amount} INR`);
    console.log(`Buyer Phone:   ${order.buyerPhone}`);
    console.log(`Buyer Name:    ${order.buyerName || 'N/A'}`);
    console.log(`Buyer Email:   ${order.buyerEmail || 'N/A'}`);
    console.log(`UTR Ref:       ${cleanUtr}`);
    console.log(`ACTION REQUIRED: Transfer website & repository to ${order.buyerPhone}`);
    console.log(`======================================================\n`);

    res.json({
      success: true,
      message: 'Payment verified successfully! Transfer initiated.',
      orderId,
      status: 'SUCCESS',
      buyerPhone: order.buyerPhone,
      utr: cleanUtr,
    });
  } catch (error) {
    console.error('[YouPI-PG] verifyPaymentUtr Error:', error);
    res.status(500).json({ message: 'Failed to verify transaction UTR.' });
  }
};

/**
 * @desc    Handle YouPI-PG Gateway Webhooks
 * @route   POST /api/payment/webhook
 */
const handleYoupiWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-gateway-signature'] || req.headers['X-Gateway-Signature'];
    const webhookSecret = process.env.YOUPI_WEBHOOK_SECRET;

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // If webhook secret configured, verify HMAC-SHA256 signature
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      const expected = `sha256=${hmac}`;

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.warn('[YouPI-PG Webhook] Invalid signature rejected.');
        return res.status(401).json({ message: 'Invalid webhook signature.' });
      }
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { orderId, status, utr } = payload;

    if (!orderId) {
      return res.status(400).json({ message: 'Missing orderId in webhook event.' });
    }

    const updates = {
      status: status || 'SUCCESS',
      ...(utr && { utr }),
      updatedAt: new Date(),
    };

    if (isMongoActive()) {
      await Order.updateOne({ orderId }, { $set: updates });
    } else {
      LocalDb.updateOrder(orderId, updates);
    }

    console.log(`[YouPI-PG Webhook] Order ${orderId} updated to status: ${status}`);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[YouPI-PG Webhook] Error:', error);
    res.status(400).json({ message: 'Webhook processing error.' });
  }
};

/**
 * @desc    Get all website purchase orders (for admin / owner dashboard)
 * @route   GET /api/payment/orders
 */
const getAllOrders = async (req, res) => {
  try {
    let orders = [];
    if (isMongoActive()) {
      orders = await Order.find().sort({ createdAt: -1 });
    } else {
      const fs = require('fs');
      const path = require('path');
      const ORDERS_FILE = path.join(__dirname, '../data/orders.json');
      if (fs.existsSync(ORDERS_FILE)) {
        orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8') || '[]');
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }
    res.json(orders);
  } catch (error) {
    console.error('[YouPI-PG] getAllOrders Error:', error);
    res.status(500).json({ message: 'Failed to retrieve orders.' });
  }
};

module.exports = {
  createPaymentOrder,
  getPaymentStatus,
  verifyPaymentUtr,
  handleYoupiWebhook,
  getAllOrders,
};

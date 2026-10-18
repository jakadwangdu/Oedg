const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  getPaymentStatus,
  verifyPaymentUtr,
  handleYoupiWebhook,
} = require('../controllers/paymentController');

// Public route to initiate website purchase payment with YouPI-PG
router.post('/create-order', createPaymentOrder);

// Query order status
router.get('/status/:orderId', getPaymentStatus);

// Buyer submits UTR transaction reference
router.post('/verify-utr', verifyPaymentUtr);

// Webhook endpoint for YouPI-PG gateway automated verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleYoupiWebhook);

module.exports = router;

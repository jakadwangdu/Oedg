const express = require('express');
const router = express.Router();
const { submitBuyInquiry, submitHelpRequest, getAllInquiries } = require('../controllers/inquiryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/buy', submitBuyInquiry);
router.post('/help', submitHelpRequest);
router.get('/all', protect, getAllInquiries);

module.exports = router;

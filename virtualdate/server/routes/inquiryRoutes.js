const express = require('express');
const router = express.Router();
const { submitBuyInquiry, submitHelpRequest, getAllInquiries } = require('../controllers/inquiryController');

router.post('/buy', submitBuyInquiry);
router.post('/help', submitHelpRequest);
router.get('/all', getAllInquiries);

module.exports = router;

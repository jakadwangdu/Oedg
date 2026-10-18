const express = require('express');
const router = express.Router();
const { submitBuyInquiry, submitHelpRequest } = require('../controllers/inquiryController');

router.post('/buy', submitBuyInquiry);
router.post('/help', submitHelpRequest);

module.exports = router;

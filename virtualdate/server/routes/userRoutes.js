const express = require('express');
const router = express.Router();
const { updateProfile, getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateProfile);

module.exports = router;

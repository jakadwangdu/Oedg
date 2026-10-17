const User = require('../models/User');
const cloudinary = require('../utils/cloudinary');

// @desc    Update user profile
// @route   PUT /api/users/:id
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only own profile
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { username, bio } = req.body;
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;

    // Handle avatar upload
    if (req.body.avatarBase64) {
      const result = await cloudinary.uploader.upload(req.body.avatarBase64, {
        folder: 'virtualdate/avatars',
        transformation: [{ width: 200, height: 200, crop: 'fill' }],
      });
      user.avatar = result.secure_url;
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      username: updated.username,
      email: updated.email,
      avatar: updated.avatar,
      bio: updated.bio,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateProfile, getUserById };

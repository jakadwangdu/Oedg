const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const LocalDb = require('../config/localDb');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_vd_2026', { expiresIn: '30d' });
};

const isMongooseConnected = () => mongoose.connection.readyState === 1;

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Mongoose if connected
    if (isMongooseConnected()) {
      try {
        const userExists = await User.findOne({
          $or: [{ email: cleanEmail }, { username: cleanUsername }],
        });
        if (userExists) {
          return res.status(409).json({ message: 'Email or username already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
        });

        // Also duplicate to local DB as backup
        try {
          LocalDb.createUser({ username: cleanUsername, email: cleanEmail, password });
        } catch (e) {}

        return res.status(201).json({
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          token: generateToken(user._id),
        });
      } catch (dbErr) {
        console.warn('Mongoose register failed, falling back to local DB:', dbErr.message);
      }
    }

    // 2. Local DB Fallback (100% reliable)
    const localExists = LocalDb.findUser({ email: cleanEmail }) || LocalDb.findUser({ username: cleanUsername });
    if (localExists) {
      return res.status(409).json({ message: 'Email or username already in use' });
    }

    const localUser = await LocalDb.createUser({ username: cleanUsername, email: cleanEmail, password });
    return res.status(201).json({
      _id: localUser._id,
      username: localUser.username,
      email: localUser.email,
      avatar: localUser.avatar,
      bio: localUser.bio,
      token: generateToken(localUser._id),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required' });
    }

    const cleanInput = email.trim();

    // 1. Try Mongoose if connected
    if (isMongooseConnected()) {
      try {
        const user = await User.findOne({
          $or: [
            { email: cleanInput.toLowerCase() },
            { username: cleanInput },
          ],
        });

        if (user && user.passwordHash) {
          const isMatch = await user.comparePassword(password);
          if (isMatch) {
            return res.json({
              _id: user._id,
              username: user.username,
              email: user.email,
              avatar: user.avatar,
              bio: user.bio,
              token: generateToken(user._id),
            });
          }
        }
      } catch (dbErr) {
        console.warn('Mongoose login failed, checking local DB:', dbErr.message);
      }
    }

    // 2. Local DB Fallback
    const localUser = LocalDb.findUser({ email: cleanInput }) || LocalDb.findUser({ username: cleanInput });
    if (localUser && localUser.passwordHash) {
      const isMatch = await LocalDb.comparePassword(password, localUser.passwordHash);
      if (isMatch) {
        return res.json({
          _id: localUser._id,
          username: localUser.username,
          email: localUser.email,
          avatar: localUser.avatar,
          bio: localUser.bio,
          token: generateToken(localUser._id),
        });
      }
    }

    return res.status(401).json({ message: 'Invalid email/username or password.' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  const user = req.user;
  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    isGuest: !!user.isGuest,
  });
};

// @desc    Instant Guest Login (No registration or email needed)
// @route   POST /api/auth/guest
const guestLogin = async (req, res) => {
  try {
    const { username } = req.body;
    const guestUser = LocalDb.createGuestUser(username);
    const token = generateToken(guestUser._id);
    return res.status(200).json({
      _id: guestUser._id,
      username: guestUser.username,
      email: guestUser.email,
      avatar: guestUser.avatar,
      bio: guestUser.bio,
      isGuest: true,
      token,
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ message: error.message || 'Guest login failed' });
  }
};

// @desc    Google OAuth Login / Registration
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { credential, email, name, avatar, googleId } = req.body;
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let userGoogleId = googleId;

    // Decode JWT credential from Google Identity Services if provided
    if (credential) {
      try {
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          userEmail = decoded.email;
          userName = userName || decoded.name || decoded.email.split('@')[0];
          userAvatar = userAvatar || decoded.picture;
          userGoogleId = userGoogleId || decoded.sub;
        }
      } catch (e) {
        console.warn('Could not decode Google credential token, using fallback fields:', e.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'Google email is required' });
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    const cleanUsername = (userName || cleanEmail.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 25);

    // 1. Try Mongoose if connected
    if (isMongooseConnected()) {
      try {
        let user = await User.findOne({
          $or: [
            ...(userGoogleId ? [{ googleId: userGoogleId }] : []),
            { email: cleanEmail },
          ],
        });

        if (!user) {
          let finalUsername = cleanUsername;
          const nameTaken = await User.findOne({ username: finalUsername });
          if (nameTaken) {
            finalUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
          }

          user = await User.create({
            username: finalUsername,
            email: cleanEmail,
            avatar: userAvatar || '',
            googleId: userGoogleId || '',
            passwordHash: '',
            bio: 'Connected via Google account ✦',
          });
        } else {
          let modified = false;
          if (userAvatar && !user.avatar) {
            user.avatar = userAvatar;
            modified = true;
          }
          if (userGoogleId && !user.googleId) {
            user.googleId = userGoogleId;
            modified = true;
          }
          if (modified) await user.save();
        }

        return res.json({
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          token: generateToken(user._id),
        });
      } catch (dbErr) {
        console.warn('Mongoose Google login failed, trying local DB:', dbErr.message);
      }
    }

    // 2. Local DB Fallback
    let localUser = LocalDb.findUser({ googleId: userGoogleId }) || LocalDb.findUser({ email: cleanEmail });
    if (!localUser) {
      let finalUsername = cleanUsername;
      const nameTaken = LocalDb.findUser({ username: finalUsername });
      if (nameTaken) {
        finalUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }
      localUser = await LocalDb.createGoogleUser({
        username: finalUsername,
        email: cleanEmail,
        avatar: userAvatar || '',
        googleId: userGoogleId || '',
      });
    }

    return res.json({
      _id: localUser._id,
      username: localUser.username,
      email: localUser.email,
      avatar: localUser.avatar,
      bio: localUser.bio,
      token: generateToken(localUser._id),
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: error.message || 'Google login failed' });
  }
};

module.exports = { register, login, getMe, guestLogin, googleLogin };

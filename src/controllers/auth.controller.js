const { secret, expiresIn } = require('../config/jwt');
const { User } = require('../models');
const googleClient = require('../config/google');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role_id: user.role_id,
    },
    secret,
    { expiresIn }
  );
};

// Register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role_id: 1,
      is_verified: true,
    });

    res.status(201).json({
      message: 'Registrasi berhasil! Silakan login.',
      user_id: user.user_id,
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.password) return res.status(400).json({ message: 'Use Google login' });
    if (!user.is_verified) return res.status(403).json({ message: 'Please verify your email' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);

    res.json({
      message: 'Login success',
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profile_pic: user.profile_pic,
        role_id: user.role_id,
        is_verified: user.is_verified,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const user_id = req.user.user_id;
  const { username, phone } = req.body;

  try {
    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    if (username) user.username = username;
    if (phone) user.phone = phone;
    if (req.file) {
      if (user.profile_pic) {
        const oldFileName = user.profile_pic.split('/').pop();
        const oldPath = path.join(__dirname, '../../public/uploads/avatar', oldFileName);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profile_pic = `/uploads/avatar/${req.file.filename}`;
    }
    await user.save();

    const updatedUser = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profile_pic: user.profile_pic,
      role_id: user.role_id,
      is_verified: user.is_verified,
    };

    res.json({
      message: 'Profil berhasil diperbarui',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error update profile:', error);
    res.status(500).json({ error: error.message });
  }
};

// Ganti Password
exports.changePassword = async (req, res) => {
  const user_id = req.user.user_id;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(user_id);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ message: 'Password lama salah' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Hapus Akun
exports.deleteAccount = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    await User.destroy({ where: { user_id } });
    res.json({ message: 'Akun berhasil dihapus permanen' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

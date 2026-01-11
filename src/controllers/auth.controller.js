const { EmailOtp } = require('../models');
const { generateOtp } = require('../utils/otp');
const { secret, expiresIn } = require('../config/jwt');
const { User } = require('../models');
const emailService = require('../services/email.service');
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
      is_verified: false,
    });

    const otp = generateOtp();
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    await EmailOtp.create({
      user_id: user.user_id,
      otp_code: otp,
      expired_at: expiredAt,
    });

    await emailService.sendOtpEmail(email, otp);

    res.status(201).json({
      message: 'Register success, OTP sent to email',
      user_id: user.user_id,
    });
  } catch (err) {
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

// Google Login
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({
        username: name.replace(/\s/g, '').toLowerCase(),
        email,
        profile_pic: picture,
        role_id: 1,
        is_verified: true,
      });
    }

    const jwtToken = generateToken(user);

    res.json({
      message: 'Google login success',
      token: jwtToken,
    });
  } catch (err) {
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { user_id, otp } = req.body;

    const record = await EmailOtp.findOne({
      where: { user_id, otp_code: otp },
      order: [['created_at', 'DESC']],
    });

    if (!record) return res.status(400).json({ message: 'OTP invalid' });

    if (new Date() > record.expired_at) return res.status(400).json({ message: 'OTP expired' });

    await User.update({ is_verified: true }, { where: { user_id } });

    await EmailOtp.destroy({ where: { user_id } });

    res.json({ message: 'Email verified successfully' });
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

    // 1. Update text
    if (username) user.username = username;
    if (phone) user.phone = phone;

    // 2. Update Foto Profil
    if (req.file) {
      // Hapus foto lama jika ada (untuk kebersihan server)
      if (user.profile_pic) {
        // Ambil nama file saja dari path database
        const oldFileName = user.profile_pic.split('/').pop();
        const oldPath = path.join(__dirname, '../../public/uploads/avatar', oldFileName);

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      user.profile_pic = `/uploads/avatar/${req.file.filename}`;
    }

    await user.save();

    // 3. PENTING: Kembalikan data user LENGKAP agar LocalStorage terupdate sempurna
    const updatedUser = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profile_pic: user.profile_pic, // Ini yang paling penting
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

    // Verifikasi Password Lama
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ message: 'Password lama salah' });

    // Hash Password Baru
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

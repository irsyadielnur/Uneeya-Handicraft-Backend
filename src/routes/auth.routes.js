const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const uploadAvatar = require('../middlewares/avatarImg.middleware');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/verify-otp', authController.verifyOtp);

const requireCustomer = [auth, authorize('manage_profile')];

// Route Profil
router.get('/profile', requireCustomer, authController.getProfile);
router.put('/profile', requireCustomer, uploadAvatar.single('profile_pic'), authController.updateProfile);
router.put('/change-password', requireCustomer, authController.changePassword);
router.delete('/delete-account', requireCustomer, authController.deleteAccount);

module.exports = router;

const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/shop');
  },
  filename: (req, file, cb) => cb(null, `shop-logo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// Public: Get Info
router.get('/', shopController.getShopInfo);

// Owner Only: Update Settings
router.put('/', auth, authorize('manage_shop'), upload.single('logo'), shopController.updateShopInfo);

module.exports = router;

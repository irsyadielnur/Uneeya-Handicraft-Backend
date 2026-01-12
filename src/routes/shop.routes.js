const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');
const upload = require('../middlewares/shopImg.middleware');

// Public: Get Info
router.get('/', shopController.getShopInfo);

// Owner Only: Update Settings
router.put('/', auth, authorize('manage_shop'), upload.single('logo'), shopController.updateShopInfo);

module.exports = router;

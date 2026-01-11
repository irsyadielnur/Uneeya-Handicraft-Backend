const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');

// router.get('/', auth, authorize('manage_shipping'), shippingController.getShippingMethods);
router.get('/provinces', auth, authorize('create_order', 'manage_shop'), shippingController.getProvinces);
router.get('/cities/:province_id', auth, authorize('create_order', 'manage_shop'), shippingController.getCities);
router.get('/district/:city_id', auth, authorize('create_order', 'manage_shop'), shippingController.getDistrict);
router.post('/check-cost', auth, authorize('create_order'), shippingController.checkShippingCost);

module.exports = router;

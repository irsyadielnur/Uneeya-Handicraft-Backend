const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');

// Middleware Gabungan
const requireCustomer = [auth, authorize('manage_cart')];

router.get('/', requireCustomer, cartController.getCart);
router.post('/', requireCustomer, cartController.addToCart);
router.put('/:id', requireCustomer, cartController.updateCartItem);
router.delete('/:id', requireCustomer, cartController.removeCartItem);

module.exports = router;

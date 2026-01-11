const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');

router.post('/snap/:order_id', auth, authorize('create_order'), paymentController.createSnapTransaction);
router.get('/status/:order_id', auth, authorize('create_order'), paymentController.getStatusPayment);
router.post('/midtrans-notification', authorize('create_order'), paymentController.handleMidtransNotification);
router.post('/verify/:order_id', auth, authorize('create_order'), paymentController.verifyPaymentStatus);

module.exports = router;

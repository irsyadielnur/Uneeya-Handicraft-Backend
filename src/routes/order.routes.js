const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');

// CUSTOMER
router.post('/checkout', auth, authorize('create_order'), orderController.createOrder);
router.get('/history', auth, authorize('view_own_orders'), orderController.getMyOrders);
router.get('/:order_id', auth, authorize('view_own_orders'), orderController.getMyOrderDetail);
router.get('/:order_id/timeline', auth, authorize('view_own_orders'), orderController.getOrderTimeline);
router.put('/:order_id/complete', auth, authorize('view_own_orders'), orderController.completeOrder);
router.delete('/:order_id', auth, authorize('view_own_orders'), orderController.deleteMyOrder);

// SALES & OWNER
router.get('/admin/all', auth, authorize('manage_orders'), orderController.getAllOrdersAdmin);
router.put('/admin/:order_id/status', auth, authorize('manage_orders'), orderController.updateOrderStatus);
router.delete('/admin/:order_id', auth, authorize('manage_orders'), orderController.deleteOrderAdmin);

module.exports = router;

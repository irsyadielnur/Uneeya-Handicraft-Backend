const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');

router.get('/admin/customers', auth, authorize('manage_customers'), userController.getAllCustomers);

module.exports = router;

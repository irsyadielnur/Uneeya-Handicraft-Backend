const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const addressController = require('../controllers/address.controller');

// Customer Only
router.post('/', auth, addressController.createAddress);
router.get('/', auth, addressController.getAddresses);
router.get('/:id', auth, addressController.getAddressById);
router.put('/:address_id', auth, addressController.updateAddress);
router.delete('/:id', auth, addressController.deleteAddress);
router.patch('/:id/default', auth, addressController.setDefaultAddress);

module.exports = router;

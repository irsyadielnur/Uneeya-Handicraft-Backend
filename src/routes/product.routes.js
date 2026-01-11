const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');
const upload = require('../middlewares/productImg.middleware');
const productController = require('../controllers/product.controller');

// Public
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/similar', productController.getSimilarProducts);

// Marketing Admin
router.get('/admin/list', auth, authorize('manage_products'), productController.getAdminProducts);
router.post('/', auth, authorize('manage_products'), upload.array('images', 20), productController.createProduct);
router.put('/:id', auth, authorize('manage_products'), upload.array('images', 20), productController.updateProduct);
router.delete('/:id', auth, authorize('manage_products'), productController.deleteProduct);

module.exports = router;

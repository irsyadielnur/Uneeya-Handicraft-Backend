const express = require('express');
const router = express.Router();
const favController = require('../controllers/favorite.controller'); // Sesuaikan nama
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');

const requireCustomer = [auth, authorize('manage_favorites')];

router.get('/', requireCustomer, favController.getMyFavorites);
router.post('/', requireCustomer, favController.addFavorite);
router.delete('/:product_id', requireCustomer, favController.removeFavorite);

module.exports = router;

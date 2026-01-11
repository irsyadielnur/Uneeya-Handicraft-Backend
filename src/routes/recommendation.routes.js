const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const recommendationController = require('../controllers/recommendation.controller');

router.get('/products', auth, recommendationController.getMyRecommendations);
router.get('/products/top', recommendationController.getTopProductsPublic);

module.exports = router;

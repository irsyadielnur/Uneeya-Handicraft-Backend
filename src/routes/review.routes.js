const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');

// Customer
router.post('/', auth, authorize('manage_review'), reviewController.createReview);
router.put('/:review_id', auth, authorize('manage_review'), reviewController.updateReview);
router.delete('/:review_id', auth, authorize('manage_review'), reviewController.deleteReview);
router.get('/my', auth, authorize('manage_review'), reviewController.getMyReviews);

// Public
router.get('/recent', reviewController.getRecentReviews);
router.get('/product/:product_id', reviewController.getProductReviews);

module.exports = router;

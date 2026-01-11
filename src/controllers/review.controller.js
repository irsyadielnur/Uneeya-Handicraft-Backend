const { Review, Order, OrderItem, Product, User, ProductImage, sequelize } = require('../models');
const recalculateRating = require('../utils/recalculateRating');

// Create Review (Customer)
exports.createReview = async (req, res) => {
  const user_id = req.user.user_id;
  const { order_id, product_id, rating, comment } = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      // 1. Pastikan order milik user & completed
      const order = await Order.findOne({
        where: { order_id, user_id, status: 'completed' },
        include: [OrderItem],
      });

      if (!order) {
        return res.status(400).json({
          message: 'Order tidak valid atau belum selesai',
        });
      }

      // 2. Pastikan product ada di order
      const productInOrder = order.OrderItems.find((item) => item.product_id === product_id);

      if (!productInOrder) {
        return res.status(400).json({
          message: 'Produk tidak ada di order tersebut',
        });
      }

      // 3. Create review
      const review = await Review.create(
        {
          user_id,
          order_id,
          product_id,
          rating,
          comment,
        },
        { transaction: t }
      );

      await recalculateRating(product_id, t);
      return review;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Review (By Review ID)
exports.updateReview = async (req, res) => {
  const user_id = req.user.user_id;
  const { review_id } = req.params;
  const { rating, comment } = req.body;

  try {
    const review = await Review.findOne({
      where: { review_id, user_id },
    });

    if (!review) {
      return res.status(404).json({
        message: 'Review tidak ditemukan',
      });
    }

    await review.update({ rating, comment });
    await recalculateRating(review.product_id);

    res.json({ message: 'Review berhasil diperbarui', review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Review (By Review ID)
exports.deleteReview = async (req, res) => {
  const user_id = req.user.user_id;
  const { review_id } = req.params;

  try {
    const review = await Review.findOne({
      where: { review_id, user_id },
    });

    if (!review) {
      return res.status(404).json({
        message: 'Review tidak ditemukan',
      });
    }

    const productId = review.product_id;

    await review.destroy();
    await recalculateRating(productId);

    res.json({ message: 'Review berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List Review (Customer)
exports.getMyReviews = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const reviews = await Review.findAll({
      where: { user_id },
      include: [
        {
          model: Product,
          attributes: ['product_id', 'name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List Review Per Product (product_id) (Public Access)
exports.getProductReviews = async (req, res) => {
  const { product_id } = req.params;

  try {
    const reviews = await Review.findAll({
      where: { product_id },
      include: [
        {
          model: User,
          attributes: ['username', 'profile_pic'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecentReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      limit: 15,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['username', 'profile_pic'],
        },
        {
          model: Product,
          attributes: ['name', 'product_id'],
          include: [{ model: ProductImage, attributes: ['image_url'], limit: 1 }],
        },
      ],
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const { Product, ProductTfidf, Favorite, Cart, Order, OrderItem, ProductImage, ProductColor, sequelize } = require('../models');
const { cosineSimilarity } = require('../utils/cosineSimilarity');
const { buildUserProfile } = require('./userProfile.service');
const { Op } = require('sequelize');

// Recommendation User Login (Favorite, Cart, Order)
exports.getProductRecommendations = async (user_id, limit = 10) => {
  const userVector = await buildUserProfile(user_id);

  const favoriteProducts = await Favorite.findAll({
    where: { user_id },
    attributes: ['product_id'],
  });

  const cart = await Cart.findAll({
    where: { user_id },
    attributes: ['product_id'],
  });

  const orders = await Order.findAll({
    where: { user_id },
    attributes: ['order_id'],
  });

  const orderIds = orders.map((o) => o.order_id);
  const orderItems =
    orderIds.length > 0
      ? await OrderItem.findAll({
          where: { order_id: orderIds },
          attributes: ['product_id'],
        })
      : [];

  const excludedProductIds = new Set([...favoriteProducts.map((f) => f.product_id), ...cart.map((c) => c.product_id), ...orderItems.map((o) => o.product_id)]);

  const products = await Product.findAll({
    where: {
      is_custom: false,
      is_active: true,
    },
    include: [
      {
        model: ProductImage,
        attributes: ['image_url'],
      },
      {
        model: ProductColor,
        attributes: ['color_name', 'stock', 'product_id'],
      },
    ],
  });

  const scores = [];

  for (const product of products) {
    if (excludedProductIds.has(product.product_id)) continue;

    const tfidfRows = await ProductTfidf.findAll({
      where: { product_id: product.product_id },
    });

    if (!tfidfRows.length) continue;

    const productVector = {};
    tfidfRows.forEach((row) => {
      productVector[row.term] = row.tfidf;
    });

    const similarity = cosineSimilarity(userVector, productVector);

    if (similarity > 0) {
      scores.push({
        product,
        similarity,
      });
    }
  }

  scores.sort((a, b) => b.similarity - a.similarity);

  return scores.slice(0, limit);
};

// Recommendation Public (Detail Product)
exports.getSimilarProductsByID = async (product_id, limit = 10) => {
  const baseTfidf = await ProductTfidf.findAll({
    where: { product_id },
  });

  if (!baseTfidf.length) return [];

  const baseVector = {};
  baseTfidf.forEach((row) => {
    baseVector[row.term] = row.tfidf;
  });

  const products = await Product.findAll({
    where: {
      product_id: { [Op.ne]: product_id },
      is_custom: false,
      is_active: true,
    },
    include: [
      {
        model: ProductImage,
        attributes: ['image_url'],
      },
      {
        model: ProductColor,
        attributes: ['color_name', 'stock', 'product_id'],
      },
    ],
  });

  const scores = [];

  for (const product of products) {
    const tfidfRows = await ProductTfidf.findAll({
      where: { product_id: product.product_id },
    });

    if (!tfidfRows.length) continue;

    const productVector = {};
    tfidfRows.forEach((row) => {
      productVector[row.term] = row.tfidf;
    });

    const similarity = cosineSimilarity(baseVector, productVector);

    if (similarity > 0.15) {
      scores.push({
        product,
        similarity,
      });
    }
  }

  // console.log('BASE TFIDF: ', baseTfidf.length);
  scores.sort((a, b) => b.similarity - a.similarity);
  return scores.slice(0, limit);
};

// Top Product
exports.getTopProducts = async (limit = 10) => {
  const [results] = await sequelize.query(
    `
    SELECT
      p.product_id,
      p.name,
      p.price,
      p.rating_avg,
      SUM(oi.qty) AS total_sold
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.product_id
    LEFT JOIN orders o ON o.order_id = oi.order_id
      AND o.status IN ('paid','processing','shipped','completed')
    WHERE p.is_custom = false OR p.is_custom IS NULL
    WHERE p.is_active = true OR p.is_active IS NULL
    GROUP BY p.product_id
    ORDER BY total_sold DESC, rating_avg DESC
    LIMIT :limit
    `,
    {
      replacements: { limit },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return results;
};

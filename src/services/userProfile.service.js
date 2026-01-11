const { ProductTfidf, Favorite, Cart, Order, OrderItem, Product } = require('../models');

exports.buildUserProfile = async (user_id) => {
  const profile = {};

  const applyWeights = (tfidfRows, weight) => {
    tfidfRows.forEach((row) => {
      profile[row.term] = (profile[row.term] || 0) + row.tfidf * weight;
    });
  };

  // 1. Order history (weight 3)
  const orders = await OrderItem.findAll({
    include: [
      {
        model: Order,
        where: { user_id },
        attributes: [],
      },
      {
        model: Product,
        where: { is_custom: false, is_active: true },
        attributes: [],
      },
    ],
  });

  for (const item of orders) {
    const tfidf = await ProductTfidf.findAll({
      where: { product_id: item.product_id },
    });
    applyWeights(tfidf, 3);
  }

  // 2. Favorite (weight 2)
  const favorites = await Favorite.findAll({
    where: { user_id },
    include: [
      {
        model: Product,
        where: { is_custom: false, is_active: true },
        attributes: [],
      },
    ],
  });

  for (const fav of favorites) {
    const tfidf = await ProductTfidf.findAll({
      where: { product_id: fav.product_id },
    });
    applyWeights(tfidf, 2);
  }

  // 3. Cart (weight 1,5)
  const cartItems = await Cart.findAll({
    where: { user_id },
    include: [
      {
        model: Product,
        where: { is_custom: false, is_active: true },
        attributes: [],
      },
    ],
  });

  if (cartItems.length > 0) {
    for (const item of cartItems) {
      const tfidf = await ProductTfidf.findAll({
        where: { product_id: item.product_id },
      });
      applyWeights(tfidf, 1.5);
    }
  }

  return profile;
};

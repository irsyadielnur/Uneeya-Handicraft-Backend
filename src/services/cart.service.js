const { Cart, Product } = require('../models');

exports.getUserCart = async (user_id) => {
  const items = await Cart.findAll({
    where: { user_id },
    include: [Product],
  });

  if (items.length === 0) {
    throw new Error('Cart is empty');
  }

  return items;
};

exports.calculateCartTotal = (cartItems) => {
  let totalPrice = 0;
  let totalWeight = 0;

  cartItems.forEach((item) => {
    totalPrice += item.price * item.qty;
    totalWeight += item.qty * (item.Product.weight || 500);
  });

  if (totalWeight < 100) totalWeight = 100;

  return { totalPrice, totalWeight };
};

exports.clearCart = async (user_id, transaction) => {
  await Cart.destroy({
    where: { user_id },
    transaction,
  });
};

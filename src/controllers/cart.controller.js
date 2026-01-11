const { Cart, Product, ProductColor, ProductImage } = require('../models');

// Get Cart (Customer)
exports.getCart = async (req, res) => {
  const user_id = req.user.user_id;

  const items = await Cart.findAll({
    where: { user_id },
    include: [
      {
        model: Product,
        include: [{ model: ProductImage, attributes: ['image_url'] }],
      },
    ],
    order: [['created_at', 'ASC']],
  });

  res.json({
    items,
  });
};

// Add To Cart
exports.addToCart = async (req, res) => {
  const user_id = req.user.user_id;
  const { product_id, color_name, qty } = req.body;

  // 1. Validasi produk
  const product = await Product.findByPk(product_id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // 2. Validasi warna & stok
  const color = await ProductColor.findOne({
    where: { product_id, color_name },
  });

  if (!color) {
    return res.status(400).json({ message: 'Color not available' });
  }

  if (qty > color.stock) {
    return res.status(400).json({ message: 'Stock not enough' });
  }

  // 3. Cari item cart (user + product + color)
  let item = await Cart.findOne({
    where: {
      user_id,
      product_id,
      color_name,
    },
  });

  if (item) {
    const newQty = item.qty + qty;

    if (newQty > color.stock) {
      return res.status(400).json({ message: 'Stock exceeded' });
    }

    await item.update({ qty: newQty });
  } else {
    await Cart.create({
      user_id,
      product_id,
      product_name: product.name,
      color_name,
      price: product.price,
      qty,
    });
  }

  res.json({ message: 'Product added to cart' });
};

// Update Cart Item QTY
exports.updateCartItem = async (req, res) => {
  const user_id = req.user.user_id;
  const { qty } = req.body;
  const cart_id = req.params.id;

  const item = await Cart.findOne({
    where: { cart_id, user_id },
  });

  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  const color = await ProductColor.findOne({
    where: {
      product_id: item.product_id,
      color_name: item.color_name,
    },
  });

  if (!color || qty > color.stock) {
    return res.status(400).json({ message: 'Stock not enough' });
  }

  await item.update({ qty });

  res.json({ message: 'Cart updated' });
};

// Remove Cart Item
exports.removeCartItem = async (req, res) => {
  const user_id = req.user.user_id;
  const cart_id = req.params.id;

  const item = await Cart.findOne({
    where: { cart_id, user_id },
  });

  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  await item.destroy();

  res.json({ message: 'Item removed from cart' });
};

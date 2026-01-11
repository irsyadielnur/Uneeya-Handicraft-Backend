const { Favorite, Product, ProductImage, ProductColor } = require('../models');

// Add To Favorite
exports.addFavorite = async (req, res) => {
  const user_id = req.user.user_id;
  const { product_id } = req.body;

  try {
    const [favorite, created] = await Favorite.findOrCreate({
      where: { user_id, product_id },
    });

    if (!created) {
      return res.status(400).json({
        message: 'Produk sudah ada di favorite',
      });
    }

    res.status(201).json({
      message: 'Produk ditambahkan ke favorite',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove From Favorite
exports.removeFavorite = async (req, res) => {
  const user_id = req.user.user_id;
  const { product_id } = req.params;

  try {
    const favorite = await Favorite.findOne({
      where: { user_id, product_id },
    });

    if (!favorite) {
      return res.status(404).json({
        message: 'Produk tidak ada di favorite',
      });
    }

    await favorite.destroy();

    res.json({
      message: 'Produk dihapus dari favorite',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Favorite List (Customer)
exports.getMyFavorites = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const favorites = await Favorite.findAll({
      where: { user_id },
      include: [
        {
          model: Product,
          attributes: ['product_id', 'name', 'description', 'category', 'price', 'rating_avg', 'rating_count'],
          include: [
            {
              model: ProductImage,
              attributes: ['image_url'],
              limit: 1,
            },
            {
              model: ProductColor,
              attributes: ['color_name', 'stock', 'product_id'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const productList = favorites.map((fav) => fav.Product).filter((product) => product !== null);
    res.json(productList);
  } catch (error) {
    console.error('Error GetFavorites:', error);
    res.status(500).json({ error: error.message });
  }
};

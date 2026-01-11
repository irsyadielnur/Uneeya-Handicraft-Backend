const { getProductRecommendations, getTopProducts } = require('../services/recommendation.service');

exports.getMyRecommendations = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const recommendations = await getProductRecommendations(user_id);

    if (recommendations.length === 0) {
      const fallback = await getTopProducts();
      return res.json({
        type: 'fallback',
        recommendations: fallback,
      });
    }

    res.json({
      type: 'personalized',
      recommendations: recommendations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopProductsPublic = async (req, res) => {
  try {
    const products = await getTopProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

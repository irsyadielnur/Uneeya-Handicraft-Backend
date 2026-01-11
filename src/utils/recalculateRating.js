const { Review, Product, Sequelize } = require('../models');

module.exports = async (product_id, transaction = null) => {
  const result = await Review.findOne({
    where: { product_id },
    attributes: [
      [Sequelize.fn('AVG', Sequelize.col('rating')), 'avg_rating'],
      [Sequelize.fn('COUNT', Sequelize.col('review_id')), 'count_rating'],
    ],
    raw: true,
    transaction,
  });

  const avg = result.avg_rating ? Number(result.avg_rating).toFixed(2) : 0;
  const count = result.count_rating || 0;

  await Product.update(
    {
      rating_avg: avg,
      rating_count: count,
    },
    {
      where: { product_id },
      transaction,
    }
  );
};

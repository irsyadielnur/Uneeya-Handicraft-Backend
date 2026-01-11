const { Product, ProductTfidf, ProductMaterial, ProductColor, ProductImage } = require('../models');
const { cosineSimilarity } = require('../utils/cosineSimilarity');
const { buildQueryVector } = require('./queryVector.service');

exports.recommendFromChat = async (message, topN = 5) => {
  const queryVector = await buildQueryVector(message);
  if (Object.keys(queryVector).length === 0) return [];

  const products = await Product.findAll({
    where: {
      is_custom: false,
      is_active: true,
    },
    include: [
      {
        model: ProductMaterial,
        attributes: ['material_name'],
      },
      {
        model: ProductColor,
        attributes: ['color_name', 'stock'],
      },
      {
        model: ProductImage,
        attributes: ['image_url'],
      },
    ],
  });
  const scores = [];

  for (const product of products) {
    const tfidfRows = await ProductTfidf.findAll({
      where: { product_id: product.product_id },
    });

    const productVector = {};
    tfidfRows.forEach((row) => {
      productVector[row.term] = row.tfidf;
    });

    const similarity = cosineSimilarity(queryVector, productVector);

    if (similarity > 0.15) {
      scores.push({
        product,
        similarity,
      });
    }
  }

  scores.sort((a, b) => b.similarity - a.similarity);
  return scores.slice(0, topN);
};

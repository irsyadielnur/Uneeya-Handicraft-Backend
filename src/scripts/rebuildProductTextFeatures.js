const { Product } = require('../models');
const { generateProductTextFeature } = require('../services/productTextFeature.service');

(async () => {
  const products = await Product.findAll();

  for (const product of products) {
    await generateProductTextFeature(product.product_id);
    console.log('Generated:', product.product_id);
  }

  process.exit();
})();

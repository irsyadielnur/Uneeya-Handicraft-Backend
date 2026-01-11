const { Product, ProductMaterial, ProductColor, ProductTextFeature } = require('../models');
const { preprocessText } = require('../utils/textPreprocessing');

exports.generateProductTextFeature = async (product_id, transaction) => {
  const product = await Product.findByPk(product_id, {
    include: [ProductMaterial, ProductColor],
    transaction,
  });

  if (!product || product.is_custom || !product.is_active) {
    await ProductTextFeature.destroy({ where: { product_id }, transaction });
    return;
  }

  const materials = product.ProductMaterials.map((m) => m.material_name).join(' ');
  const colors = product.ProductColors.map((c) => c.color_name).join(' ');

  const rawText = `
    ${product.name}
    ${product.description || ''}
    ${product.category || ''}
    ${product.unique_character || ''}
    ${materials}
    ${colors}
  `;

  const cleanText = preprocessText(rawText);
  await ProductTextFeature.upsert(
    {
      product_id,
      raw_text: rawText,
      clean_text: cleanText,
    },
    { transaction }
  );
};

exports.deleteProductTextFeature = async (product_id, transaction) => {
  await ProductTextFeature.destroy({
    where: { product_id },
    transaction,
  });
};

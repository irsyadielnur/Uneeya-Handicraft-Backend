const { Product, ProductMaterial, ProductColor, ProductImage, sequelize } = require('../models');
const { generateProductTextFeature, deleteProductTextFeature } = require('../services/productTextFeature.service');
const { generateTfidf } = require('../services/tfidf.service');
const { getSimilarProductsByID } = require('../services/recommendation.service');
const path = require('path');
const fs = require('fs');

// Helper: Parse data
const parseBodyData = (data) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }
  return data;
};

// Helper: Hapus file fisik dari server
const deleteLocalImage = (imageUrl) => {
  if (!imageUrl) return;
  const filePath = path.join(__dirname, '../../public', imageUrl);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Gagal menghapus file: ${filePath}`, err);
    });
  }
};

// Create Product
exports.createProduct = async (req, res) => {
  const t = await sequelize.transaction();
  const uploadedFiles = req.files || [];

  try {
    let { name, description, category, unique_character, size, price, capital, profit, weight, materials, colors, is_custom, assigned_user_id } = req.body;

    size = parseBodyData(size);
    materials = parseBodyData(materials);
    colors = parseBodyData(colors);

    const product = await Product.create(
      {
        name,
        description,
        category,
        unique_character,
        size_length: size?.length || 0,
        size_width: size?.width || 0,
        size_height: size?.height || 0,
        price,
        capital,
        profit,
        weight,
        is_custom: is_custom === 'true' || is_custom === true ? true : false,
        assigned_user_id: assigned_user_id || null,
      },
      { transaction: t }
    );

    if (materials && Array.isArray(materials) && materials.length > 0) {
      const materialData = materials.map((m) => ({
        product_id: product.product_id,
        material_name: m,
      }));
      await ProductMaterial.bulkCreate(materialData, { transaction: t });
    }

    if (colors && Array.isArray(colors) && colors.length > 0) {
      const colorData = colors.map((c) => ({
        product_id: product.product_id,
        color_name: c.name,
        stock: c.stock,
      }));
      await ProductColor.bulkCreate(colorData, { transaction: t });
    }

    if (uploadedFiles.length > 0) {
      const imageData = uploadedFiles.map((file) => ({
        product_id: product.product_id,
        image_url: `/uploads/products/${file.filename}`,
      }));
      await ProductImage.bulkCreate(imageData, { transaction: t });
    }

    await generateProductTextFeature(product.product_id, t);
    await generateTfidf(t);

    await t.commit();

    const mainImage = uploadedFiles.length > 0 ? `/uploads/products/${uploadedFiles[0].filename}` : null;

    res.status(201).json({
      message: 'Product created successfully',
      product_id: product.product_id,
      images_uploaded: uploadedFiles.length,
      image_url: mainImage,
    });
  } catch (err) {
    await t.rollback();

    // Cleanup: Hapus file yang baru saja diupload jika transaksi gagal
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((file) => {
        fs.unlink(file.path, (e) => {
          if (e) console.error(e);
        });
      });
    }

    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Update Product By ID
exports.updateProduct = async (req, res) => {
  const t = await sequelize.transaction();
  const uploadedFiles = req.files || [];

  try {
    const productId = req.params.id;
    let { name, description, category, unique_character, size, price, capital, profit, weight, materials, colors, images_to_delete, is_active, is_custom } = req.body;

    size = parseBodyData(size);
    materials = parseBodyData(materials);
    colors = parseBodyData(colors);
    const imagesToDeleteIds = parseBodyData(images_to_delete) || [];

    const product = await Product.findByPk(productId);
    if (!product) {
      await t.rollback();
      // Cleanup file upload jika produk tidak ditemukan
      uploadedFiles.forEach((file) => fs.unlink(file.path, () => {}));
      return res.status(404).json({ message: 'Product not found' });
    }

    if (imagesToDeleteIds.length > 0) {
      const imagesToDelete = await ProductImage.findAll({
        where: {
          product_image_id: imagesToDeleteIds,
          product_id: productId,
        },
        transaction: t,
      });

      imagesToDelete.forEach((img) => {
        deleteLocalImage(img.image_url);
      });

      await ProductImage.destroy({
        where: {
          product_image_id: imagesToDeleteIds,
          product_id: productId,
        },
        transaction: t,
      });
    }

    await product.update(
      {
        name,
        description,
        category,
        unique_character,
        size_length: size?.length,
        size_width: size?.width,
        size_height: size?.height,
        price,
        capital,
        profit,
        weight,
        is_active: is_active === undefined ? product.is_active : is_active === 'true' || is_active === true,
        is_custom: is_custom === undefined ? product.is_custom : is_custom === 'true' || is_custom === true,
        assigned_user_id: is_custom === 'false' || is_custom === false ? null : product.assigned_user_id,
      },
      { transaction: t }
    );

    // Update Materials
    if (materials) {
      await ProductMaterial.destroy({ where: { product_id: productId }, transaction: t });
      if (Array.isArray(materials) && materials.length > 0) {
        await ProductMaterial.bulkCreate(
          materials.map((m) => ({ product_id: productId, material_name: m })),
          { transaction: t }
        );
      }
    }

    // Update Colors
    if (colors) {
      await ProductColor.destroy({ where: { product_id: productId }, transaction: t });
      if (Array.isArray(colors) && colors.length > 0) {
        await ProductColor.bulkCreate(
          colors.map((c) => ({ product_id: productId, color_name: c.name, stock: c.stock })),
          { transaction: t }
        );
      }
    }

    // Tambah Gambar Baru (jika ada)
    if (uploadedFiles.length > 0) {
      const imageData = uploadedFiles.map((file) => ({
        product_id: productId,
        image_url: `/uploads/products/${file.filename}`,
      }));
      await ProductImage.bulkCreate(imageData, { transaction: t });
    }

    await deleteProductTextFeature(productId, t);
    await generateProductTextFeature(productId, t);
    await generateTfidf(t);

    await t.commit();

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    await t.rollback();

    // Cleanup file baru jika gagal update
    uploadedFiles.forEach((file) => fs.unlink(file.path, () => {}));

    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Delete Product By ID
exports.deleteProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId);

    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    const productImages = await ProductImage.findAll({
      where: { product_id: productId },
      transaction: t,
    });

    // Hapus file fisik
    productImages.forEach((img) => {
      deleteLocalImage(img.image_url);
    });

    await ProductMaterial.destroy({ where: { product_id: productId }, transaction: t });
    await ProductColor.destroy({ where: { product_id: productId }, transaction: t });
    await ProductImage.destroy({ where: { product_id: productId }, transaction: t });
    await Product.destroy({ where: { product_id: productId }, transaction: t });

    await deleteProductTextFeature(productId, t);
    await generateTfidf(t);
    await t.commit();

    res.json({ message: 'Product and all related data deleted successfully' });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Get All Product
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        is_custom: false,
        is_active: true,
      },
      include: [
        { model: ProductMaterial, attributes: ['material_name'] },
        { model: ProductColor, attributes: ['color_name', 'stock'] },
        { model: ProductImage, attributes: ['image_url'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: ProductMaterial, attributes: ['material_name'] },
        { model: ProductColor, attributes: ['color_name', 'stock'] },
        { model: ProductImage, attributes: ['image_url'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Product By ID (for Detail)
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: ProductMaterial, attributes: ['material_name'] },
        { model: ProductColor, attributes: ['product_color_id', 'color_name', 'stock'] },
        { model: ProductImage, attributes: ['product_image_id', 'image_url'] },
      ],
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Silimarity Product By ID (Product Active)
exports.getSimilarProducts = async (req, res) => {
  const { id } = req.params;

  try {
    const recommendations = await getSimilarProductsByID(id, 10);

    res.json({
      base_product_id: id,
      recommendations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

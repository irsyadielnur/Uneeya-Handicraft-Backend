const { ShopSetting } = require('../models');
const path = require('path');
const fs = require('fs');

// Helper: Hapus file fisik
const deleteLocalImage = (imageUrl) => {
  if (!imageUrl) return;
  const filePath = path.join(__dirname, '../../public', imageUrl);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Gagal menghapus file: ${filePath}`, err);
    });
  }
};

// Get Shop Info
exports.getShopInfo = async (req, res) => {
  try {
    const [shop, created] = await ShopSetting.findOrCreate({
      where: { setting_id: 1 },
      defaults: {
        shop_name: 'Uneeya Handicraft',
        whatsapp_number: '628123456789',
      },
    });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Shop Info (Owner Only)
exports.updateShopInfo = async (req, res) => {
  try {
    let shop = await ShopSetting.findByPk(1);
    if (!shop) {
      shop = await ShopSetting.create({
        setting_id: 1,
        shop_name: 'Uneeya Handicraft',
      });
    }

    const { shop_name, whatsapp_number, instagram_username, tiktok_username, province_id, province_name, city_id, city_name, full_address, email_address } = req.body;

    const updateData = {
      shop_name,
      whatsapp_number,
      instagram_username,
      tiktok_username,
      province_id,
      province_name,
      city_id,
      city_name,
      full_address,
      email_address,
    };

    if (req.file) {
      if (shop.logo_url) {
        deleteLocalImage(shop.logo_url);
      }
      updateData.logo_url = `/uploads/shop/${req.file.filename}`;
    }

    await shop.update(updateData);
    res.json({ message: 'Informasi toko berhasil diperbarui', shop });
  } catch (error) {
    console.error('Error di updateShopInfo:', error);

    // Cleanup jika gagal
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({ error: error.message });
  }
};

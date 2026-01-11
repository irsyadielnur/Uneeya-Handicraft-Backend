const { Address, sequelize } = require('../models');

// Create Address
exports.createAddress = async (req, res) => {
  const userId = req.user.user_id;
  const data = req.body;

  const transaction = await sequelize.transaction();
  try {
    if (data.is_default) {
      await Address.update({ is_default: false }, { where: { user_id: userId }, transaction });
    } else {
      const count = await Address.count({ where: { user_id: userId }, transaction });
      if (count === 0) {
        data.is_default = true;
      }
    }

    const address = await Address.create({ ...data, user_id: userId }, { transaction });

    await transaction.commit();
    res.status(201).json(address);
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};

// Get All Address (By Customer)
exports.getAddresses = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const addresses = await Address.findAll({
      where: { user_id: userId },
      order: [
        ['is_default', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Address By ID
exports.getAddressById = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const address = await Address.findOne({
      where: {
        address_id: req.params.id,
        user_id: userId,
      },
    });

    if (!address) return res.status(404).json({ message: 'Address not found' });
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Address
exports.updateAddress = async (req, res) => {
  const user_id = req.user.user_id;
  const { address_id } = req.params;
  const { is_default, ...updateData } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const address = await Address.findOne({ where: { address_id, user_id }, transaction });
    if (!address) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }

    // LOGIKA BARU: Jika user ingin menjadikan ini alamat utama
    if (is_default === true || is_default === 'true') {
      // 1. Reset semua alamat user ini menjadi bukan default
      await Address.update({ is_default: false }, { where: { user_id }, transaction });
    }

    // 2. Update data alamat (termasuk status is_default yang baru)
    // Jika is_default true, dia akan jadi satu-satunya true karena langkah di atas.
    // Jika is_default false/undefined, dia hanya update data biasa.
    await address.update({ ...updateData, is_default }, { transaction });

    await transaction.commit();
    res.json({ message: 'Alamat berhasil diperbarui', data: address });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

// Delete Address
exports.deleteAddress = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const address = await Address.findOne({
      where: {
        address_id: req.params.id,
        user_id: userId,
      },
    });

    if (!address) return res.status(404).json({ message: 'Address not found' });

    await address.destroy();
    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Set Default Address
exports.setDefaultAddress = async (req, res) => {
  const userId = req.user.user_id;
  const transaction = await sequelize.transaction();

  try {
    const address = await Address.findOne({
      where: {
        address_id: req.params.id,
        user_id: userId,
      },
      transaction,
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Address not found' });
    }

    await Address.update({ is_default: false }, { where: { user_id: userId }, transaction });
    await address.update({ is_default: true }, { transaction });
    await transaction.commit();
    res.json({ message: 'Default address updated' });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};

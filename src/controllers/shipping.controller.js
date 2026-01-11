const { Address, ShopSetting } = require('../models');
const rajaOngkirService = require('../services/rajaOngkir.service');
const cartService = require('../services/cart.service');

exports.getProvinces = async (req, res) => {
  try {
    const provinces = await rajaOngkirService.getProvinces();
    res.status(200).json(provinces);
  } catch (error) {
    console.error('Error getProvinces:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getCities = async (req, res) => {
  try {
    const { province_id } = req.params;

    if (!province_id) {
      return res.status(400).json({ message: 'Province ID is required' });
    }

    const cities = await rajaOngkirService.getCities(province_id);
    res.status(200).json(cities);
  } catch (error) {
    console.error('Error getCities:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getDistrict = async (req, res) => {
  try {
    const { city_id } = req.params;

    if (!city_id) {
      return res.status(400).json({ message: 'City ID is required' });
    }

    const district = await rajaOngkirService.getDistrict(city_id);
    res.status(200).json(district);
  } catch (error) {
    console.error('Error getDistrict:', error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.checkShippingCost = async (req, res) => {
  const user_id = req.user.user_id;
  const { address_id, courier } = req.body;

  try {
    if (!address_id) {
      return res.status(400).json({ message: 'Address ID is required' });
    }

    const address = await Address.findOne({
      where: { address_id, user_id },
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const shop = await ShopSetting.findByPk(1);
    const originCity = shop?.city_id || '199';

    const cartItems = await cartService.getUserCart(user_id);
    const { totalWeight } = cartService.calculateCartTotal(cartItems);

    const weightToCheck = totalWeight > 0 ? totalWeight : 1;

    const results = await rajaOngkirService.checkDomesticCost({
      origin: originCity,
      destination: address.city_id,
      weight: weightToCheck,
      courier: courier.trim().toLowerCase(),
    });

    // console.log('RAJAONGKIR RESPONSE:', results);

    const services = results.map((item) => ({
      courier: item.code,
      service: item.service,
      description: item.description,
      cost: item.cost,
      etd: item.etd,
    }));

    res.json({
      courier: courier.toUpperCase(),
      weight: weightToCheck,
      services,
    });
  } catch (error) {
    // console.error('Check Cost Error:', error);
    res.status(500).json({ error: error.message });
  }
};

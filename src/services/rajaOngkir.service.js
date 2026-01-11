const rajaOngkir = require('../config/rajaOngkir');

exports.getProvinces = async () => {
  try {
    const response = await rajaOngkir.get('/destination/province');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching provinces:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Gagal mengambil data provinsi');
  }
};

exports.getCities = async (province_id) => {
  try {
    const response = await rajaOngkir.get(`/destination/city/${province_id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching cities for province ${province_id}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Gagal mengambil data kota');
  }
};

exports.getDistrict = async (city_id) => {
  try {
    const response = await rajaOngkir.get(`/destination/district/${city_id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching district for city ${city_id}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Gagal mengambil data district');
  }
};

exports.checkDomesticCost = async ({ origin, destination, weight, courier }) => {
  try {
    const response = await rajaOngkir.post('/calculate/domestic-cost', {
      origin,
      destination,
      weight,
      courier,
    });

    return response.data.data;
  } catch (error) {
    console.error('RAJAONGKIR KOMERCE ERROR:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to calculate shipping cost');
  }
};

const axios = require('axios');

module.exports = axios.create({
  baseURL: process.env.RAJAONGKIR_BASE_URL,
  headers: {
    key: process.env.RAJAONGKIR_API_KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

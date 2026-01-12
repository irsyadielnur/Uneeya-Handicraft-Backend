const multer = require('multer');
const { createStorage } = require('../config/cloudinary');

const storage = createStorage('avatars');

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = upload;

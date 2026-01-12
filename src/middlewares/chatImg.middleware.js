const multer = require('multer');
const { createStorage } = require('../config/cloudinary');

const storage = createStorage('chat');
const upload = multer({ storage: storage });

module.exports = upload;

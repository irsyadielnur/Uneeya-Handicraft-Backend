const multer = require('multer');
const { createStorage } = require('../config/cloudinary');

const storage = createStorage('avatars');

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
    }
  },
});

module.exports = upload;

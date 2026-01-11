const multer = require('multer');
const path = require('path');
const fs = require('fs');

// const uploadDir = path.join(__dirname, '../../public/uploads/avatar');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/avatar');
  },
  filename: (req, file, cb) => {
    const userId = req.user ? req.user.user_id : 'guest';
    const uniqueName = `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Hanya boleh upload file gambar (jpg, jpeg, png, webp)'));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

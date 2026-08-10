const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/posters");
  },

  filename: (req, file, cb) => {
    const namaFile = Date.now() + path.extname(file.originalname);
    cb(null, namaFile);
  },
});

const fileFilter = (req, file, cb) => {
  const ekstensi = /\.(jpg|jpeg|png)$/i;

  if (!ekstensi.test(file.originalname)) {
    return cb(new Error("File harus berupa JPG, JPEG, atau PNG"));
  }

  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
});
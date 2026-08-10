const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      message: "Token tidak ditemukan",
    });
  }

  try {
    const hasil = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );

    req.user = hasil;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Token tidak valid",
    });
  }
};

module.exports = auth;
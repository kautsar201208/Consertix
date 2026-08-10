const normalizeRole = (value) => String(value ?? "").trim().toLowerCase();

const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Token tidak valid",
    });
  }

  const role = normalizeRole(req.user.role);

  if (!["admin", "administrator", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Akses ditolak",
    });
  }

  next();
};

module.exports = admin;
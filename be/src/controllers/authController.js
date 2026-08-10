const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const normalizeRole = (value) => String(value ?? "user").trim().toLowerCase();

// Register
const register = async (req, res) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({
      message: "Semua data harus diisi",
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          message: "Email sudah digunakan",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
        [nama, email, passwordHash, "user"],
        (err) => {
          if (err) {
            return res.status(500).json({
              message: err.message,
            });
          }

          res.status(201).json({
            message: "Register berhasil",
          });
        }
      );
    }
  );
};

// Login
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email dan password harus diisi",
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(400).json({
          message: "Email tidak ditemukan",
        });
      }

      const user = result[0];

      const cekPassword = await bcrypt.compare(password, user.password);

      if (!cekPassword) {
        return res.status(400).json({
          message: "Password salah",
        });
      }

      const normalizedRole = normalizeRole(user.role);

      const token = jwt.sign(
        {
          id: user.id,
          nama: user.nama,
          role: normalizedRole,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      res.json({
        message: "Login berhasil",
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: normalizedRole,
        },
      });
    }
  );
};

// Profile
const profile = (req, res) => {
  res.json(req.user);
};

module.exports = {
  register,
  login,
  profile,
};
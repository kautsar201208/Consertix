
const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const normalizeRole = (value) =>
  String(value ?? "user").trim().toLowerCase();

// Register
const register = async (req, res) => {
  try {
    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({
        message: "Semua data harus diisi",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedNama = String(nama).trim();

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password minimal 6 karakter",
      });
    }

    // Cek email yang sudah terdaftar
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingUser) {
      return res.status(400).json({
        message: "Email sudah digunakan",
      });
    }

    // Enkripsi password
    const passwordHash = await bcrypt.hash(password, 10);

    // Simpan pengguna ke Supabase
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        nama: normalizedNama,
        email: normalizedEmail,
        password: passwordHash,
        role: "user",
      })
      .select("id, nama, email, role")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return res.status(400).json({
          message: "Email sudah digunakan",
        });
      }

      throw insertError;
    }

    // Buat JWT setelah registrasi berhasil
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET belum dikonfigurasi");
    }

    const normalizedRole = normalizeRole(newUser.role);

    const token = jwt.sign(
      {
        id: newUser.id,
        nama: newUser.nama,
        role: normalizedRole,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(201).json({
      message: "Register berhasil",
      token,
      user: {
        id: newUser.id,
        nama: newUser.nama,
        email: newUser.email,
        role: normalizedRole,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);

    return res.status(500).json({
      message: err.message,
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email dan password harus diisi",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Cari pengguna berdasarkan email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, nama, email, password, role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user) {
      return res.status(400).json({
        message: "Email tidak ditemukan",
      });
    }

    // Periksa password
    const cekPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!cekPassword) {
      return res.status(400).json({
        message: "Password salah",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET belum dikonfigurasi");
    }

    const normalizedRole = normalizeRole(user.role);

    // Buat JWT
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

    return res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: normalizedRole,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);

    return res.status(500).json({
      message: err.message,
    });
  }
};

// Profile
const profile = (req, res) => {
  return res.json(req.user);
};

module.exports = {
  register,
  login,
  profile,
};

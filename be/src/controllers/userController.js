const db = require("../config/db");
const bcrypt = require("bcrypt");

// GET /api/users — list semua user
const getAllUsers = (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : "%";
  const role = req.query.role || null;

  let query = "SELECT id, nama, email, role, created_at FROM users WHERE (nama LIKE ? OR email LIKE ?)";
  const params = [search, search];

  if (role && role !== "all") {
    query += " AND role = ?";
    params.push(role);
  }

  query += " ORDER BY created_at DESC";

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results);
  });
};

// GET /api/users/:id — detail satu user
const getUserById = (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT id, nama, email, role, created_at FROM users WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      if (results.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });
      res.json(results[0]);
    }
  );
};

// PUT /api/users/:id — update role user
const updateUserRole = (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "Role tidak valid. Gunakan 'user' atau 'admin'." });
  }

  // Cegah admin mengubah role dirinya sendiri
  if (req.user && String(req.user.id) === String(id)) {
    return res.status(400).json({ message: "Tidak dapat mengubah role diri sendiri." });
  }

  db.query(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: "User tidak ditemukan" });
      res.json({ message: `Role user berhasil diubah menjadi '${role}'.` });
    }
  );
};

// DELETE /api/users/:id — hapus user
const deleteUser = (req, res) => {
  const { id } = req.params;

  // Cegah admin menghapus dirinya sendiri
  if (req.user && String(req.user.id) === String(id)) {
    return res.status(400).json({ message: "Tidak dapat menghapus akun diri sendiri." });
  }

  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User tidak ditemukan" });
    res.json({ message: "User berhasil dihapus." });
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};

const supabase = require("../config/supabase");

const getAllUsers = async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : null;
  const role = req.query.role && req.query.role !== "all" ? req.query.role : null;

  try {
    let users;
    if (search) {
      let nameQuery = supabase
        .from("users")
        .select("id, nama, email, role, created_at")
        .ilike("nama", search);
      let emailQuery = supabase
        .from("users")
        .select("id, nama, email, role, created_at")
        .ilike("email", search);

      if (role) {
        nameQuery = nameQuery.eq("role", role);
        emailQuery = emailQuery.eq("role", role);
      }

      const [nameResult, emailResult] = await Promise.all([nameQuery, emailQuery]);
      if (nameResult.error) throw nameResult.error;
      if (emailResult.error) throw emailResult.error;
      users = [...nameResult.data, ...emailResult.data];
    } else {
      let query = supabase
        .from("users")
        .select("id, nama, email, role, created_at");
      if (role) query = query.eq("role", role);

      const { data, error } = await query;
      if (error) throw error;
      users = data;
    }

    const uniqueUsers = new Map(users.map((user) => [String(user.id), user]));
    return res.json(
      [...uniqueUsers.values()].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
    );
  } catch (error) {
    console.error("Gagal mengambil daftar pengguna:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, nama, email, role, created_at")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User tidak ditemukan" });
    return res.json(data);
  } catch (error) {
    console.error("Gagal mengambil pengguna:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!role || !["user", "admin"].includes(role)) {
    return res.status(400).json({
      message: "Role tidak valid. Gunakan 'user' atau 'admin'.",
    });
  }
  if (req.user && String(req.user.id) === String(req.params.id)) {
    return res.status(400).json({
      message: "Tidak dapat mengubah role diri sendiri.",
    });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User tidak ditemukan" });
    return res.json({ message: `Role user berhasil diubah menjadi '${role}'.` });
  } catch (error) {
    console.error("Gagal mengubah role pengguna:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  if (req.user && String(req.user.id) === String(req.params.id)) {
    return res.status(400).json({
      message: "Tidak dapat menghapus akun diri sendiri.",
    });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User tidak ditemukan" });
    return res.json({ message: "User berhasil dihapus." });
  } catch (error) {
    console.error("Gagal menghapus pengguna:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};

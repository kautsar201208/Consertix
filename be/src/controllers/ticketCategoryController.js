const supabase = require("../config/supabase");

const tambahKategori = async (req, res) => {
  const { event_id, nama_kategori, harga, stok } = req.body;

  if (!event_id || !nama_kategori || !harga || !stok) {
    return res.status(400).json({ message: "Semua data harus diisi" });
  }

  try {
    const { error } = await supabase.from("ticket_categories").insert({
      event_id,
      nama_kategori,
      harga,
      stok,
    });

    if (error) throw error;
    return res.status(201).json({ message: "Kategori tiket berhasil ditambahkan" });
  } catch (error) {
    console.error("Gagal menambahkan kategori tiket:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const getKategoriByEvent = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ticket_categories")
      .select("*")
      .eq("event_id", req.params.event_id);

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error("Gagal mengambil kategori event:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const getKategori = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ticket_categories")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Kategori tiket tidak ditemukan" });
    }
    return res.json(data);
  } catch (error) {
    console.error("Gagal mengambil kategori tiket:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const updateKategori = async (req, res) => {
  const { nama_kategori, harga, stok } = req.body;

  try {
    const { data, error } = await supabase
      .from("ticket_categories")
      .update({ nama_kategori, harga, stok })
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Kategori tiket tidak ditemukan" });
    }
    return res.json({ message: "Kategori tiket berhasil diubah" });
  } catch (error) {
    console.error("Gagal mengubah kategori tiket:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const hapusKategori = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ticket_categories")
      .delete()
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Kategori tiket tidak ditemukan" });
    }
    return res.json({ message: "Kategori tiket berhasil dihapus" });
  } catch (error) {
    console.error("Gagal menghapus kategori tiket:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  tambahKategori,
  getKategoriByEvent,
  getKategori,
  updateKategori,
  hapusKategori,
};

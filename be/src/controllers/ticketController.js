const supabase = require("../config/supabase");

const tambahKategori = async (req, res) => {
  const { event_id, nama_kategori, harga, stok } = req.body;

  if (!event_id || !nama_kategori || !harga || !stok) {
    return res.status(400).json({ message: "Semua data harus diisi" });
  }

  try {
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", event_id)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) {
      return res.status(404).json({ message: "Event tidak ditemukan" });
    }

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

const getKategori = async (_req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from("ticket_categories")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    const eventIds = [...new Set(categories.map((category) => category.event_id))];
    let eventsById = new Map();

    if (eventIds.length > 0) {
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id, judul")
        .in("id", eventIds);

      if (eventsError) throw eventsError;
      eventsById = new Map(events.map((event) => [String(event.id), event.judul]));
    }

    return res.json(
      categories.map((category) => ({
        ...category,
        nama_event: eventsById.get(String(category.event_id)) ?? null,
      }))
    );
  } catch (error) {
    console.error("Gagal mengambil kategori tiket:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const getDetailKategori = async (req, res) => {
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
    console.error("Gagal mengambil detail kategori tiket:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const updateKategori = async (req, res) => {
  const { event_id, nama_kategori, harga, stok } = req.body;

  if (!event_id || !nama_kategori || !harga || !stok) {
    return res.status(400).json({ message: "Semua data harus diisi" });
  }

  try {
    const { data, error } = await supabase
      .from("ticket_categories")
      .update({ event_id, nama_kategori, harga, stok })
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
  getKategori,
  getDetailKategori,
  updateKategori,
  hapusKategori,
};

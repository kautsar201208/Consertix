const supabase = require("../config/supabase");

const parseTicketCategories = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const tambahEvent = async (req, res) => {
  const {
    nama_artis,
    judul,
    deskripsi,
    tanggal,
    jam,
    lokasi,
    status,
    ticket_categories: ticketCategoriesPayload,
  } = req.body;

  const ticketCategories = parseTicketCategories(ticketCategoriesPayload);
  const invalidCategory = ticketCategories.some((category) => {
    const namaKategori = category?.nama_kategori?.trim();
    return (
      !namaKategori ||
      category?.harga === "" ||
      category?.harga === undefined ||
      category?.harga === null ||
      category?.stok === "" ||
      category?.stok === undefined ||
      category?.stok === null
    );
  });

  if (!nama_artis || !judul || !deskripsi || !tanggal || !jam || !lokasi) {
    return res.status(400).json({ message: "Semua data harus diisi" });
  }
  if (ticketCategories.length === 0) {
    return res.status(400).json({
      message: "Minimal satu kategori tiket harus ditambahkan",
    });
  }
  if (invalidCategory) {
    return res.status(400).json({
      message: "Semua kategori tiket harus memiliki nama, harga, dan stok",
    });
  }

  try {
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        nama_artis,
        judul,
        deskripsi,
        tanggal,
        jam,
        lokasi,
        poster: req.file ? req.file.filename : null,
        status: status || "aktif",
        created_by: req.user.id,
      })
      .select("id")
      .single();

    if (eventError) throw eventError;

    const categories = ticketCategories.map((category) => ({
      event_id: event.id,
      nama_kategori: category.nama_kategori.trim(),
      harga: Number(category.harga),
      stok: Number(category.stok),
    }));
    const { error: categoriesError } = await supabase
      .from("ticket_categories")
      .insert(categories);

    if (categoriesError) {
      const { error: rollbackError } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);
      if (rollbackError) {
        console.error("Gagal membatalkan event setelah kategori gagal:", rollbackError.message);
      }
      throw categoriesError;
    }

    return res.status(201).json({
      message: "Event dan kategori tiket berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Gagal menambahkan event:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const getEvents = async (_req, res) => {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const userIds = [...new Set(events.map((event) => event.created_by).filter(Boolean))];
    let usersById = new Map();
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, nama")
        .in("id", userIds);
      if (usersError) throw usersError;
      usersById = new Map(users.map((user) => [String(user.id), user.nama]));
    }

    return res.json(
      events.map((event) => ({
        ...event,
        admin: usersById.get(String(event.created_by)) ?? null,
      }))
    );
  } catch (error) {
    console.error("Gagal mengambil daftar event:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const getEvent = async (req, res) => {
  try {
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!event) return res.status(404).json({ message: "Event tidak ditemukan" });

    const { data: categories, error: categoriesError } = await supabase
      .from("ticket_categories")
      .select("id, nama_kategori, harga, stok")
      .eq("event_id", req.params.id)
      .order("id", { ascending: true });

    if (categoriesError) throw categoriesError;
    return res.json({ ...event, ticket_categories: categories });
  } catch (error) {
    console.error("Gagal mengambil detail event:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const updateEvent = async (req, res) => {
  const {
    nama_artis,
    judul,
    deskripsi,
    tanggal,
    jam,
    lokasi,
    status,
    ticket_categories: ticketCategoriesPayload,
  } = req.body;

  try {
    const updates = {
      nama_artis,
      judul,
      deskripsi,
      tanggal,
      jam,
      lokasi,
      status,
    };
    if (req.file) updates.poster = req.file.filename;

    const { data: event, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!event) return res.status(404).json({ message: "Event tidak ditemukan" });

    const ticketCategories = parseTicketCategories(ticketCategoriesPayload);
    if (ticketCategories.length === 0) {
      return res.json({ message: "Event berhasil diubah" });
    }

    for (const category of ticketCategories) {
      const values = {
        nama_kategori: category.nama_kategori.trim(),
        harga: Number(category.harga),
        stok: Number(category.stok),
      };
      const result = category.id
        ? await supabase
            .from("ticket_categories")
            .update(values)
            .eq("id", category.id)
            .eq("event_id", req.params.id)
        : await supabase
            .from("ticket_categories")
            .insert({ ...values, event_id: req.params.id });

      if (result.error) throw result.error;
    }

    return res.json({ message: "Event dan kategori tiket berhasil diubah" });
  } catch (error) {
    console.error("Gagal mengubah event:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const hapusEvent = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Event tidak ditemukan" });
    return res.json({ message: "Event berhasil dihapus" });
  } catch (error) {
    console.error("Gagal menghapus event:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  tambahEvent,
  getEvents,
  getEvent,
  updateEvent,
  hapusEvent,
};

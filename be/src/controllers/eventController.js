const supabase = require("../config/supabase");

const isMissingColumnError = (err, column) =>
  Boolean(
    err &&
      (err.code === "PGRST204" ||
        err.code === "42703" ||
        (typeof err.message === "string" && err.message.includes(column)))
  );

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
    syarat_ketentuan,
    tanggal,
    jam,
    jam_selesai,
    open_gate,
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
    const finalDeskripsi =
      syarat_ketentuan && syarat_ketentuan.trim()
        ? `${deskripsi}\n\nSyarat dan Ketentuan:\n${syarat_ketentuan.trim()}`
        : deskripsi;

    const baseEventData = {
      nama_artis,
      judul,
      deskripsi: finalDeskripsi,
      tanggal,
      jam,
      lokasi,
      poster: req.file ? req.file.filename : null,
      status: status || "aktif",
      created_by: req.user.id,
    };

    // Extra optional fields — stored only if columns exist
    if (jam_selesai && jam_selesai.trim()) baseEventData.jam_selesai = jam_selesai.trim();
    if (open_gate && open_gate.trim()) baseEventData.open_gate = open_gate.trim();

    let eventResult = await supabase
      .from("events")
      .insert(
        syarat_ketentuan && syarat_ketentuan.trim()
          ? { ...baseEventData, syarat_ketentuan: syarat_ketentuan.trim() }
          : baseEventData
      )
      .select("id")
      .single();

    if (isMissingColumnError(eventResult.error, "syarat_ketentuan")) {
      eventResult = await supabase
        .from("events")
        .insert(baseEventData)
        .select("id")
        .single();
    }

    // Fallback: jika jam_selesai / open_gate belum ada di DB, coba tanpa keduanya
    if (
      isMissingColumnError(eventResult.error, "jam_selesai") ||
      isMissingColumnError(eventResult.error, "open_gate")
    ) {
      const { jam_selesai: _js, open_gate: _og, ...safeData } = baseEventData;
      eventResult = await supabase
        .from("events")
        .insert(safeData)
        .select("id")
        .single();
    }
    if (eventResult.error) throw eventResult.error;
    const event = eventResult.data;

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
    syarat_ketentuan,
    tanggal,
    jam,
    jam_selesai,
    open_gate,
    lokasi,
    status,
    ticket_categories: ticketCategoriesPayload,
  } = req.body;

  try {
    const finalDeskripsi =
      syarat_ketentuan && syarat_ketentuan.trim()
        ? `${deskripsi}\n\nSyarat dan Ketentuan:\n${syarat_ketentuan.trim()}`
        : deskripsi;

    const updates = {
      nama_artis,
      judul,
      deskripsi: finalDeskripsi,
      tanggal,
      jam,
      lokasi,
      status,
    };
    if (jam_selesai !== undefined) updates.jam_selesai = jam_selesai || null;
    if (open_gate !== undefined) updates.open_gate = open_gate || null;
    if (req.file) updates.poster = req.file.filename;

    let eventResult = await supabase
      .from("events")
      .update(
        syarat_ketentuan && syarat_ketentuan.trim()
          ? { ...updates, syarat_ketentuan: syarat_ketentuan.trim() }
          : updates
      )
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (isMissingColumnError(eventResult.error, "syarat_ketentuan")) {
      eventResult = await supabase
        .from("events")
        .update(updates)
        .eq("id", req.params.id)
        .select("id")
        .maybeSingle();
    }

    // Fallback: jika jam_selesai / open_gate belum ada di DB
    if (
      isMissingColumnError(eventResult.error, "jam_selesai") ||
      isMissingColumnError(eventResult.error, "open_gate")
    ) {
      const { jam_selesai: _js, open_gate: _og, ...safeUpdates } = updates;
      eventResult = await supabase
        .from("events")
        .update(safeUpdates)
        .eq("id", req.params.id)
        .select("id")
        .maybeSingle();
    }

    if (eventResult.error) throw eventResult.error;
    const event = eventResult.data;
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

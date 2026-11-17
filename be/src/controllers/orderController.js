
const supabase = require("../config/supabase");

const isMissingColumnError = (err, column) =>
  Boolean(
    err &&
      (err.code === "PGRST204" ||
        err.code === "42703" ||
        (typeof err.message === "string" && err.message.includes(column)))
  );

// Membuat pesanan
const buatPesanan = async (req, res) => {
  const {
    ticket_category_id,
    jumlah_tiket,
    first_name,
    last_name,
    email,
    phone,
    id_number,
    date_birth,
  } = req.body;

  const quantity = Number(jumlah_tiket);
  const user_id = req.user.id;

  // Validasi data pemesan
  if (
    !ticket_category_id ||
    !jumlah_tiket ||
    !first_name ||
    !last_name ||
    !email ||
    !phone ||
    !id_number
  ) {
    return res.status(400).json({
      message: "Semua data harus diisi",
    });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      message: "Jumlah tiket tidak valid",
    });
  }

  try {
    // Ambil data kategori tiket
    const { data: ticket, error: ticketError } = await supabase
      .from("ticket_categories")
      .select("id, harga, stok")
      .eq("id", ticket_category_id)
      .maybeSingle();

    if (ticketError) throw ticketError;

    if (!ticket) {
      return res.status(404).json({
        message: "Kategori tiket tidak ditemukan",
      });
    }

    // Validasi stok tiket
    if (quantity > ticket.stok) {
      return res.status(400).json({
        message: "Stok tiket tidak mencukupi",
      });
    }

    const total_harga = ticket.harga * quantity;

    // Siapkan data pesanan dasar
    const baseOrder = {
      user_id,
      ticket_category_id,
      jumlah_tiket: quantity,
      total_harga,
      first_name,
      last_name,
      email,
      phone,
      id_number,
    };

    let orderData = date_birth
      ? { ...baseOrder, date_birth }
      : baseOrder;

    // Simpan pesanan ke Supabase dengan fallback jika kolom belum ada di tabel orders
    let orderResult = await supabase
      .from("orders")
      .insert(orderData)
      .select("id")
      .single();

    if (isMissingColumnError(orderResult.error, "date_birth")) {
      delete orderData.date_birth;
      orderResult = await supabase
        .from("orders")
        .insert(orderData)
        .select("id")
        .single();
    }

    // Jika kolom first_name / last_name / email / phone / id_number juga belum ada di tabel Supabase
    if (
      isMissingColumnError(orderResult.error, "first_name") ||
      isMissingColumnError(orderResult.error, "last_name") ||
      isMissingColumnError(orderResult.error, "phone") ||
      isMissingColumnError(orderResult.error, "id_number") ||
      isMissingColumnError(orderResult.error, "email")
    ) {
      const fallbackOrder = {
        user_id,
        ticket_category_id,
        jumlah_tiket: quantity,
        total_harga,
      };
      orderResult = await supabase
        .from("orders")
        .insert(fallbackOrder)
        .select("id")
        .single();
    }

    if (orderResult.error) throw orderResult.error;
    const order = orderResult.data;

    // Kurangi stok dengan pengecekan stok sebelumnya
    const { data: updatedTicket, error: stockError } = await supabase
      .from("ticket_categories")
      .update({
        stok: ticket.stok - quantity,
      })
      .eq("id", ticket_category_id)
      .eq("stok", ticket.stok)
      .gte("stok", quantity)
      .select("id")
      .maybeSingle();

    // Jika stok gagal diperbarui, batalkan pesanan
    if (stockError || !updatedTicket) {
      const { error: rollbackError } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (rollbackError) {
        console.error(
          "Gagal membatalkan pesanan:",
          rollbackError.message
        );
      }

      if (stockError) throw stockError;

      return res.status(400).json({
        message: "Stok tiket tidak mencukupi",
      });
    }

    return res.status(201).json({
      message: "Pesanan berhasil dibuat",
      order_id: order ? order.id : null,
    });
  } catch (error) {
    console.error("Gagal membuat pesanan:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Mengambil riwayat pesanan
const riwayatPesanan = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    const categoryIds = [
      ...new Set(
        orders.map((order) => order.ticket_category_id)
      ),
    ];

    const { data: categories, error: categoriesError } =
      await supabase
        .from("ticket_categories")
        .select("id, event_id, nama_kategori")
        .in("id", categoryIds);

    if (categoriesError) throw categoriesError;

    const eventIds = [
      ...new Set(
        categories.map((category) => category.event_id)
      ),
    ];

    let events = [];

    if (eventIds.length > 0) {
      const { data, error: eventsError } = await supabase
        .from("events")
        .select("id, judul")
        .in("id", eventIds);

      if (eventsError) throw eventsError;

      events = data || [];
    }

    const categoriesById = new Map(
      categories.map((category) => [
        String(category.id),
        category,
      ])
    );

    const eventsById = new Map(
      events.map((event) => [
        String(event.id),
        event,
      ])
    );

    const result = orders.map((order) => {
      const category = categoriesById.get(
        String(order.ticket_category_id)
      );

      const event =
        category &&
        eventsById.get(String(category.event_id));

      return {
        ...order,
        nama_kategori: category?.nama_kategori ?? null,
        judul: event?.judul ?? null,
      };
    });

    return res.json(result);
  } catch (error) {
    console.error(
      "Gagal mengambil riwayat pesanan:",
      error.message
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Mengambil detail pesanan
const detailPesanan = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        message: "Pesanan tidak ditemukan",
      });
    }

    return res.json(data);
  } catch (error) {
    console.error(
      "Gagal mengambil detail pesanan:",
      error.message
    );

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  buatPesanan,
  riwayatPesanan,
  detailPesanan,
};

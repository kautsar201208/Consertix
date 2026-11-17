
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

// Mengambil ringkasan penjualan tiket dikelompokkan per event untuk dashboard admin
const getEventsSummaryAdmin = async (_req, res) => {
  try {
    // 1. Ambil semua event
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, judul, deskripsi, tanggal, jam, lokasi, poster, status, created_at")
      .order("created_at", { ascending: false });

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) {
      return res.json([]);
    }

    // 2. Ambil semua kategori tiket
    const eventIds = events.map((e) => e.id);
    const { data: categories, error: catError } = await supabase
      .from("ticket_categories")
      .select("id, event_id, nama_kategori, harga, stok")
      .in("event_id", eventIds);

    if (catError) throw catError;

    const categoryIds = (categories || []).map((c) => c.id);

    // 3. Ambil semua order yang berkaitan
    let orders = [];
    if (categoryIds.length > 0) {
      const { data: orderData, error: ordersError } = await supabase
        .from("orders")
        .select("id, ticket_category_id, jumlah_tiket, total_harga, first_name, last_name, email, phone, id_number, date_birth, created_at")
        .in("ticket_category_id", categoryIds)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      orders = orderData || [];
    }

    // Buat map categoryId -> eventId & category
    const catToEventMap = new Map();
    (categories || []).forEach((c) => {
      catToEventMap.set(String(c.id), c.event_id);
    });

    // Inisialisasi summary map
    const summaryMap = new Map();
    events.forEach((ev) => {
      summaryMap.set(String(ev.id), {
        ...ev,
        total_orders: 0,
        total_tickets_sold: 0,
        total_revenue: 0,
        buyers_count: 0,
        categories: (categories || []).filter((c) => String(c.event_id) === String(ev.id)),
      });
    });

    const uniqueBuyersPerEvent = new Map();

    orders.forEach((ord) => {
      const eventId = catToEventMap.get(String(ord.ticket_category_id));
      if (eventId && summaryMap.has(String(eventId))) {
        const item = summaryMap.get(String(eventId));
        item.total_orders += 1;
        item.total_tickets_sold += Number(ord.jumlah_tiket || 0);
        item.total_revenue += Number(ord.total_harga || 0);

        if (!uniqueBuyersPerEvent.has(String(eventId))) {
          uniqueBuyersPerEvent.set(String(eventId), new Set());
        }
        const buyerIdentifier = ord.email || ord.phone || `${ord.first_name} ${ord.last_name}`;
        uniqueBuyersPerEvent.get(String(eventId)).add(buyerIdentifier);
      }
    });

    summaryMap.forEach((item, id) => {
      item.buyers_count = uniqueBuyersPerEvent.has(id)
        ? uniqueBuyersPerEvent.get(id).size
        : item.total_orders;
    });

    return res.json(Array.from(summaryMap.values()));
  } catch (error) {
    console.error("Gagal mengambil ringkasan event:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// Mengambil seluruh riwayat order / pembeli tiket (bisa difilter via ?event_id=xxx)
const getAllOrdersAdmin = async (req, res) => {
  try {
    const { event_id } = req.query;

    let targetCategoryIds = null;
    let targetEvent = null;

    if (event_id) {
      const { data: eventData } = await supabase
        .from("events")
        .select("id, judul, lokasi, tanggal, poster")
        .eq("id", event_id)
        .maybeSingle();

      targetEvent = eventData;

      const { data: catData, error: catErr } = await supabase
        .from("ticket_categories")
        .select("id, event_id, nama_kategori, harga")
        .eq("event_id", event_id);

      if (catErr) throw catErr;
      targetCategoryIds = (catData || []).map((c) => c.id);

      if (targetCategoryIds.length === 0) {
        return res.json([]);
      }
    }

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (targetCategoryIds) {
      query = query.in("ticket_category_id", targetCategoryIds);
    }

    const { data: orders, error: ordersError } = await query;
    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) return res.json([]);

    // Ambil detail kategori dan event untuk setiap order
    const categoryIds = [...new Set(orders.map((o) => o.ticket_category_id))];
    const { data: categories } = await supabase
      .from("ticket_categories")
      .select("id, event_id, nama_kategori, harga")
      .in("id", categoryIds);

    const eventIds = [...new Set((categories || []).map((c) => c.event_id))];
    const { data: events } = eventIds.length
      ? await supabase.from("events").select("id, judul, lokasi, tanggal, poster").in("id", eventIds)
      : { data: [] };

    // Ambil bukti pembayaran dari tabel payments jika ada
    const orderIds = orders.map((o) => o.id);
    const { data: payments } = orderIds.length
      ? await supabase.from("payments").select("id, order_id, bukti_pembayaran, status, created_at").in("order_id", orderIds)
      : { data: [] };

    const catMap = new Map((categories || []).map((c) => [String(c.id), c]));
    const eventMap = new Map((events || []).map((e) => [String(e.id), e]));
    const paymentMap = new Map((payments || []).map((p) => [String(p.order_id), p]));

    const result = orders.map((ord) => {
      const cat = catMap.get(String(ord.ticket_category_id));
      const ev = cat ? eventMap.get(String(cat.event_id)) : (targetEvent || null);
      const pay = paymentMap.get(String(ord.id));

      const buyerName = `${ord.first_name || ""} ${ord.last_name || ""}`.trim() || ord.email || "Pembeli";

      return {
        ...ord,
        nama: buyerName,
        nama_kategori: cat?.nama_kategori ?? "Reguler",
        harga_tiket: cat?.harga ?? 0,
        event_id: ev?.id ?? null,
        judul: ev?.judul ?? "Event Konser",
        event_lokasi: ev?.lokasi ?? "",
        event_tanggal: ev?.tanggal ?? "",
        event_poster: ev?.poster ?? null,
        bukti_pembayaran: pay?.bukti_pembayaran ?? null,
        status: pay?.status || ord.status || "Paid",
      };
    });

    return res.json(result);
  } catch (error) {
    console.error("Gagal mengambil seluruh transaksi:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  buatPesanan,
  riwayatPesanan,
  detailPesanan,
  getEventsSummaryAdmin,
  getAllOrdersAdmin,
};

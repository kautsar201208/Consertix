const supabase = require("../config/supabase");

const uploadPembayaran = async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ message: "Order tidak ditemukan" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "Bukti pembayaran wajib diupload" });
  }

  try {
    const { error } = await supabase.from("payments").insert({
      order_id,
      bukti_pembayaran: req.file.filename,
    });

    if (error) throw error;
    return res.status(201).json({
      message: "Bukti pembayaran berhasil diupload",
    });
  } catch (error) {
    console.error("Gagal menyimpan pembayaran:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const getPembayaran = async (_req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (payments.length === 0) return res.json([]);

    const orderIds = [...new Set(payments.map((payment) => payment.order_id))];
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, user_id, ticket_category_id")
      .in("id", orderIds);

    if (ordersError) throw ordersError;

    const userIds = [...new Set(orders.map((order) => order.user_id))];
    const categoryIds = [...new Set(orders.map((order) => order.ticket_category_id))];
    const [usersResult, categoriesResult] = await Promise.all([
      userIds.length
        ? supabase.from("users").select("id, nama").in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      categoryIds.length
        ? supabase
            .from("ticket_categories")
            .select("id, event_id")
            .in("id", categoryIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (usersResult.error) throw usersResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    const eventIds = [...new Set(categoriesResult.data.map((category) => category.event_id))];
    const { data: events, error: eventsError } = eventIds.length
      ? await supabase.from("events").select("id, judul").in("id", eventIds)
      : { data: [], error: null };
    if (eventsError) throw eventsError;

    const ordersById = new Map(orders.map((order) => [String(order.id), order]));
    const usersById = new Map(
      usersResult.data.map((user) => [String(user.id), user.nama])
    );
    const categoriesById = new Map(
      categoriesResult.data.map((category) => [String(category.id), category])
    );
    const eventsById = new Map(events.map((event) => [String(event.id), event.judul]));

    return res.json(
      payments.map((payment) => {
        const order = ordersById.get(String(payment.order_id));
        const category =
          order && categoriesById.get(String(order.ticket_category_id));
        return {
          ...payment,
          nama: order ? usersById.get(String(order.user_id)) ?? null : null,
          judul: category
            ? eventsById.get(String(category.event_id)) ?? null
            : null,
        };
      })
    );
  } catch (error) {
    console.error("Gagal mengambil daftar pembayaran:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const verifikasiPembayaran = async (req, res) => {
  const { status } = req.body;
  const verified_by = req.user.id;

  try {
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, order_id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) {
      return res.status(404).json({ message: "Payment tidak ditemukan" });
    }

    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({ status, verified_by })
      .eq("id", req.params.id);
    if (updatePaymentError) throw updatePaymentError;

    let statusOrder = "pending";
    if (status === "verified") statusOrder = "paid";
    else if (status === "rejected") statusOrder = "cancelled";

    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({ status: statusOrder })
      .eq("id", payment.order_id);
    if (updateOrderError) throw updateOrderError;

    return res.json({ message: "Status pembayaran berhasil diperbarui" });
  } catch (error) {
    console.error("Gagal memverifikasi pembayaran:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadPembayaran,
  getPembayaran,
  verifikasiPembayaran,
};

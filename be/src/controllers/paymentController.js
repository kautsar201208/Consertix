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

const snap = require("../config/midtrans");

// Membuat Snap Token Midtrans untuk Order Tiket
const createMidtransTransaction = async (req, res) => {
  const {
    order_id,
    gross_amount,
    item_name,
    customer_name,
    customer_email,
    customer_phone,
    payment_method,
  } = req.body;

  if (!order_id || !gross_amount) {
    return res.status(400).json({ message: "order_id dan gross_amount wajib diisi" });
  }

  try {
    const amount = Math.round(Number(gross_amount));

    // Midtrans transaction ID yang unik
    const transactionOrderId = `CTX-ORDER-${order_id}-${Date.now().toString().slice(-4)}`;

    // Sesuaikan metode pembayaran aktif sesuai yang dipilih user di aplikasi
    let enabledPayments = [
      "qris",
      "other_qris",
      "gopay",
      "shopeepay",
      "bca_va",
      "bni_va",
      "bri_va",
      "echannel",
      "mandiri_va",
      "permata_va",
      "credit_card",
    ];

    if (payment_method === "bca_va") {
      enabledPayments = ["bca_va"];
    } else if (payment_method === "mandiri_va") {
      enabledPayments = ["echannel", "mandiri_va"];
    } else if (payment_method === "qris") {
      enabledPayments = ["qris", "other_qris", "gopay", "shopeepay"];
    } else if (payment_method === "gopay") {
      enabledPayments = ["gopay"];
    } else if (payment_method === "cc") {
      enabledPayments = ["credit_card"];
    }

    const parameter = {
      transaction_details: {
        order_id: transactionOrderId,
        gross_amount: amount,
      },
      item_details: [
        {
          id: String(order_id),
          price: amount,
          quantity: 1,
          name: (item_name || "Tiket Konser Concertix").slice(0, 50),
        },
      ],
      customer_details: {
        first_name: customer_name || "Pengunjung",
        email: customer_email || "customer@concertix.id",
        phone: customer_phone || "081234567890",
      },
      enabled_payments: enabledPayments,
      callbacks: {
        finish: "https://concertix.app/payment/finish",
        error: "https://concertix.app/payment/error",
        pending: "https://concertix.app/payment/pending",
      },
      expiry: {
        unit: "minutes",
        duration: 30,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return res.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: transactionOrderId,
    });
  } catch (error) {
    console.error("Gagal membuat transaksi Midtrans:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// Webhook Notification handler dari Midtrans
const handleMidtransNotification = async (req, res) => {
  try {
    const statusResponse = await snap.transaction.notification(req.body);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Midtrans Notif: Order ${orderId} Status: ${transactionStatus}`);

    // Ekstrak original numeric order ID dari CTX-ORDER-{id}-{random}
    const match = orderId.match(/CTX-ORDER-(\d+)-/);
    const realOrderId = match ? match[1] : null;

    let orderStatus = "pending";

    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        orderStatus = "paid";
      }
    } else if (transactionStatus === "settlement") {
      orderStatus = "paid";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      orderStatus = "cancelled";
    } else if (transactionStatus === "pending") {
      orderStatus = "pending";
    }

    if (realOrderId) {
      await supabase
        .from("orders")
        .update({ status: orderStatus })
        .eq("id", realOrderId);
    }

    return res.status(200).json({ status: "OK" });
  } catch (error) {
    console.error("Gagal memproses notifikasi Midtrans:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// Cek Status Transaksi Midtrans (untuk polling dari mobile)
const checkMidtransStatus = async (req, res) => {
  const { midtrans_order_id } = req.params;
  try {
    const statusResponse = await snap.transaction.status(midtrans_order_id);
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let isPaid = false;
    if (transactionStatus === "settlement") {
      isPaid = true;
    } else if (transactionStatus === "capture" && fraudStatus === "accept") {
      isPaid = true;
    }

    // Jika sudah terbayar, update status order di database
    if (isPaid) {
      const match = midtrans_order_id.match(/CTX-ORDER-(\d+)-/);
      const realOrderId = match ? match[1] : null;
      if (realOrderId) {
        await supabase.from("orders").update({ status: "paid" }).eq("id", realOrderId);
      }
    }

    return res.json({
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
      is_paid: isPaid,
      gross_amount: statusResponse.gross_amount,
      payment_type: statusResponse.payment_type,
    });
  } catch (error) {
    console.error("Gagal cek status transaksi Midtrans:", error.message);
    // Jika transaksi tidak ditemukan (belum ada), kembalikan pending
    return res.status(200).json({
      transaction_status: "pending",
      is_paid: false,
      error: error.message,
    });
  }
};

// Simulasi Pembayaran Sandbox (khusus mode development / testing)
const simulateSandboxPayment = async (req, res) => {
  if (process.env.MIDTRANS_IS_PRODUCTION === "true") {
    return res.status(403).json({ message: "Simulasi hanya berlaku di mode sandbox" });
  }

  const { midtrans_order_id } = req.body;
  if (!midtrans_order_id) {
    return res.status(400).json({ message: "midtrans_order_id wajib diisi" });
  }

  try {
    const match = midtrans_order_id.match(/CTX-ORDER-(\d+)-/);
    const realOrderId = match ? match[1] : null;

    if (realOrderId) {
      await supabase.from("orders").update({ status: "paid" }).eq("id", realOrderId);
    }

    return res.json({
      success: true,
      message: "Simulasi pembayaran sandbox berhasil dikonfirmasi sebagai PAID",
      order_id: realOrderId,
    });
  } catch (error) {
    console.error("Gagal simulasi pembayaran sandbox:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadPembayaran,
  getPembayaran,
  verifikasiPembayaran,
  createMidtransTransaction,
  handleMidtransNotification,
  checkMidtransStatus,
  simulateSandboxPayment,
};

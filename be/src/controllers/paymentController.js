const db = require("../config/db");

// Upload Bukti Pembayaran
const uploadPembayaran = (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({
      message: "Order tidak ditemukan",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: "Bukti pembayaran wajib diupload",
    });
  }

  const bukti = req.file.filename;

  const sql = `
    INSERT INTO payments
    (order_id, bukti_pembayaran)
    VALUES (?, ?)
  `;

  db.query(sql, [order_id, bukti], (err) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    res.status(201).json({
      message: "Bukti pembayaran berhasil diupload",
    });
  });
};

// Semua Pembayaran
const getPembayaran = (req, res) => {
  const sql = `
    SELECT
      payments.*,
      users.nama,
      events.judul
    FROM payments
    JOIN orders
      ON payments.order_id = orders.id
    JOIN users
      ON orders.user_id = users.id
    JOIN ticket_categories
      ON orders.ticket_category_id = ticket_categories.id
    JOIN events
      ON ticket_categories.event_id = events.id
    ORDER BY payments.created_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    res.json(result);
  });
};

// Verifikasi Pembayaran
const verifikasiPembayaran = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const verified_by = req.user.id;

  // Update status pembayaran
  db.query(
    `
    UPDATE payments
    SET status = ?, verified_by = ?
    WHERE id = ?
    `,
    [status, verified_by, id],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      // Ambil order_id dari payment
      db.query(
        "SELECT order_id FROM payments WHERE id = ?",
        [id],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: err.message,
            });
          }

          if (result.length === 0) {
            return res.status(404).json({
              message: "Payment tidak ditemukan",
            });
          }

          const order_id = result[0].order_id;

          // Tentukan status order berdasarkan status payment
          let statusOrder = "pending";

          if (status === "verified") {
            statusOrder = "paid";
          } else if (status === "rejected") {
            statusOrder = "cancelled";
          }

          // Update status order
          db.query(
            "UPDATE orders SET status = ? WHERE id = ?",
            [statusOrder, order_id],
            (err) => {
              if (err) {
                return res.status(500).json({
                  message: err.message,
                });
              }

              res.json({
                message: "Status pembayaran berhasil diperbarui",
              });
            }
          );
        }
      );
    }
  );
};

module.exports = {
  uploadPembayaran,
  getPembayaran,
  verifikasiPembayaran,
};
const db = require("../config/db");

// Buat Pesanan
const buatPesanan = (req, res) => {
  const { ticket_category_id, jumlah_tiket } = req.body;
  const user_id = req.user.id;

  if (!ticket_category_id || !jumlah_tiket) {
    return res.status(400).json({
      message: "Semua data harus diisi",
    });
  }

  db.query(
    "SELECT * FROM ticket_categories WHERE id = ?",
    [ticket_category_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "Kategori tiket tidak ditemukan",
        });
      }

      const tiket = result[0];

      if (jumlah_tiket > tiket.stok) {
        return res.status(400).json({
          message: "Stok tiket tidak mencukupi",
        });
      }

      const total_harga = tiket.harga * jumlah_tiket;

      db.query(
        `INSERT INTO orders
        (user_id, ticket_category_id, jumlah_tiket, total_harga)
        VALUES (?, ?, ?, ?)`,
        [
          user_id,
          ticket_category_id,
          jumlah_tiket,
          total_harga,
        ],
        (err) => {
          if (err) {
            return res.status(500).json({
              message: err.message,
            });
          }

          db.query(
            "UPDATE ticket_categories SET stok = stok - ? WHERE id = ?",
            [jumlah_tiket, ticket_category_id]
          );

          res.status(201).json({
            message: "Pesanan berhasil dibuat",
          });
        }
      );
    }
  );
};

// Riwayat Pesanan User
const riwayatPesanan = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT
      orders.*,
      ticket_categories.nama_kategori,
      events.judul
    FROM orders
    JOIN ticket_categories
      ON orders.ticket_category_id = ticket_categories.id
    JOIN events
      ON ticket_categories.event_id = events.id
    WHERE orders.user_id = ?
    ORDER BY orders.created_at DESC
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    res.json(result);
  });
};

// Detail Pesanan
const detailPesanan = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM orders WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "Pesanan tidak ditemukan",
        });
      }

      res.json(result[0]);
    }
  );
};

module.exports = {
  buatPesanan,
  riwayatPesanan,
  detailPesanan,
};
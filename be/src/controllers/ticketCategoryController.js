const db = require("../config/db");

// Tambah kategori tiket
const tambahKategori = (req, res) => {
  const { event_id, nama_kategori, harga, stok } = req.body;

  if (!event_id || !nama_kategori || !harga || !stok) {
    return res.status(400).json({
      message: "Semua data harus diisi",
    });
  }

  const sql = `
    INSERT INTO ticket_categories
    (event_id, nama_kategori, harga, stok)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [event_id, nama_kategori, harga, stok],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.status(201).json({
        message: "Kategori tiket berhasil ditambahkan",
      });
    }
  );
};

// Semua kategori berdasarkan event
const getKategoriByEvent = (req, res) => {
  const { event_id } = req.params;

  db.query(
    "SELECT * FROM ticket_categories WHERE event_id = ?",
    [event_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json(result);
    }
  );
};

// Detail kategori
const getKategori = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM ticket_categories WHERE id = ?",
    [id],
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

      res.json(result[0]);
    }
  );
};

// Update kategori
const updateKategori = (req, res) => {
  const { id } = req.params;
  const { nama_kategori, harga, stok } = req.body;

  const sql = `
    UPDATE ticket_categories
    SET
      nama_kategori = ?,
      harga = ?,
      stok = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [nama_kategori, harga, stok, id],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json({
        message: "Kategori tiket berhasil diubah",
      });
    }
  );
};

// Hapus kategori
const hapusKategori = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM ticket_categories WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json({
        message: "Kategori tiket berhasil dihapus",
      });
    }
  );
};

module.exports = {
  tambahKategori,
  getKategoriByEvent,
  getKategori,
  updateKategori,
  hapusKategori,
};
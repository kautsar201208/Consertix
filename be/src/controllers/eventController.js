const db = require("../config/db");

const parseTicketCategories = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  return [];
};

// Tambah Event
const tambahEvent = (req, res) => {
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

  const poster = req.file ? req.file.filename : null;
  const created_by = req.user.id;
  const ticketCategories = parseTicketCategories(ticketCategoriesPayload);

  if (
    !nama_artis ||
    !judul ||
    !deskripsi ||
    !tanggal ||
    !jam ||
    !lokasi
  ) {
    return res.status(400).json({
      message: "Semua data harus diisi",
    });
  }

  if (ticketCategories.length === 0) {
    return res.status(400).json({
      message: "Minimal satu kategori tiket harus ditambahkan",
    });
  }

  const invalidCategory = ticketCategories.find((category) => {
    const namaKategori = category?.nama_kategori?.trim();
    const harga = category?.harga;
    const stok = category?.stok;

    return !namaKategori || harga === "" || harga === undefined || harga === null || stok === "" || stok === undefined || stok === null;
  });

  if (invalidCategory) {
    return res.status(400).json({
      message: "Semua kategori tiket harus memiliki nama, harga, dan stok",
    });
  }

  const sql = `
    INSERT INTO events
    (nama_artis, judul, deskripsi, tanggal, jam, lokasi, poster, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      nama_artis,
      judul,
      deskripsi,
      tanggal,
      jam,
      lokasi,
      poster,
      status || "aktif",
      created_by,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      const eventId = result.insertId;
      const categorySql = `
        INSERT INTO ticket_categories
        (event_id, nama_kategori, harga, stok)
        VALUES ${ticketCategories.map(() => "(?, ?, ?, ?)").join(", ")}
      `;
      const categoryValues = ticketCategories.flatMap((category) => [
        eventId,
        category.nama_kategori.trim(),
        Number(category.harga),
        Number(category.stok),
      ]);

      db.query(categorySql, categoryValues, (categoryErr) => {
        if (categoryErr) {
          return res.status(500).json({
            message: categoryErr.message,
          });
        }

        res.status(201).json({
          message: "Event dan kategori tiket berhasil ditambahkan",
        });
      });
    }
  );
};

// Semua Event
const getEvents = (req, res) => {
  const sql = `
    SELECT
      events.*,
      users.nama AS admin
    FROM events
    LEFT JOIN users
    ON events.created_by = users.id
    ORDER BY events.created_at DESC
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

// Detail Event
const getEvent = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM events WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          message: "Event tidak ditemukan",
        });
      }

      db.query(
        "SELECT id, nama_kategori, harga, stok FROM ticket_categories WHERE event_id = ? ORDER BY id ASC",
        [id],
        (categoryErr, categories) => {
          if (categoryErr) {
            return res.status(500).json({
              message: categoryErr.message,
            });
          }

          res.json({
            ...result[0],
            ticket_categories: categories,
          });
        }
      );
    }
  );
};

// Update Event
const updateEvent = (req, res) => {
  const { id } = req.params;

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

  const poster = req.file ? req.file.filename : null;

  let sql = "";
  let data = [];

  if (poster) {
    sql = `
      UPDATE events
      SET
        nama_artis = ?,
        judul = ?,
        deskripsi = ?,
        tanggal = ?,
        jam = ?,
        lokasi = ?,
        poster = ?,
        status = ?
      WHERE id = ?
    `;

    data = [
      nama_artis,
      judul,
      deskripsi,
      tanggal,
      jam,
      lokasi,
      poster,
      status,
      id,
    ];
  } else {
    sql = `
      UPDATE events
      SET
        nama_artis = ?,
        judul = ?,
        deskripsi = ?,
        tanggal = ?,
        jam = ?,
        lokasi = ?,
        status = ?
      WHERE id = ?
    `;

    data = [
      nama_artis,
      judul,
      deskripsi,
      tanggal,
      jam,
      lokasi,
      status,
      id,
    ];
  }

  db.query(sql, data, (err) => {
    if (err) {
      return res.status(500).json({
        message: err.message,
      });
    }

    const ticketCategories = parseTicketCategories(ticketCategoriesPayload);
    if (ticketCategories.length === 0) {
      return res.json({ message: "Event berhasil diubah" });
    }

    let pending = ticketCategories.length;
    let categoryError = null;
    ticketCategories.forEach((category) => {
      const categoryValues = [
        category.nama_kategori.trim(),
        Number(category.harga),
        Number(category.stok),
        id,
      ];
      const categorySql = category.id
        ? "UPDATE ticket_categories SET nama_kategori = ?, harga = ?, stok = ? WHERE id = ? AND event_id = ?"
        : "INSERT INTO ticket_categories (event_id, nama_kategori, harga, stok) VALUES (?, ?, ?, ?)";
      const values = category.id
        ? [...categoryValues, id]
        : [id, ...categoryValues.slice(0, 3)];

      db.query(categorySql, values, (updateErr) => {
        if (updateErr) categoryError = updateErr;
        pending -= 1;
        if (pending === 0) {
          if (categoryError) {
            return res.status(500).json({ message: categoryError.message });
          }
          res.json({ message: "Event dan kategori tiket berhasil diubah" });
        }
      });
    });
  });
};

// Hapus Event
const hapusEvent = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM events WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json({
        message: "Event berhasil dihapus",
      });
    }
  );
};

module.exports = {
  tambahEvent,
  getEvents,
  getEvent,
  updateEvent,
  hapusEvent,
};
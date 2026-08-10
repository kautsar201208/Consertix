const express = require("express");
const router = express.Router();

const {
  tambahKategori,
  getKategori,
  getDetailKategori,
  updateKategori,
  hapusKategori,
} = require("../controllers/ticketController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// Semua user bisa melihat kategori tiket
router.get("/", getKategori);
router.get("/:id", getDetailKategori);

// Hanya admin
router.post("/", auth, admin, tambahKategori);
router.put("/:id", auth, admin, updateKategori);
router.delete("/:id", auth, admin, hapusKategori);

module.exports = router;
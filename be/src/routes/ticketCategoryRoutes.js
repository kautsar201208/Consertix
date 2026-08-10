const express = require("express");
const router = express.Router();

const {
  tambahKategori,
  getKategoriByEvent,
  getKategori,
  updateKategori,
  hapusKategori,
} = require("../controllers/ticketCategoryController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// User
router.get("/event/:event_id", getKategoriByEvent);
router.get("/:id", getKategori);

// Admin
router.post("/", auth, admin, tambahKategori);
router.put("/:id", auth, admin, updateKategori);
router.delete("/:id", auth, admin, hapusKategori);

module.exports = router;
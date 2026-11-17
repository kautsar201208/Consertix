const express = require("express");
const router = express.Router();

const {
  buatPesanan,
  riwayatPesanan,
  detailPesanan,
  getEventsSummaryAdmin,
  getAllOrdersAdmin,
} = require("../controllers/orderController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// Admin routes (diletakkan sebelum /:id)
router.get("/admin/events-summary", auth, admin, getEventsSummaryAdmin);
router.get("/admin/all", auth, admin, getAllOrdersAdmin);

// User & shared routes
router.post("/", auth, buatPesanan);
router.get("/", auth, riwayatPesanan);
router.get("/:id", auth, detailPesanan);

module.exports = router;
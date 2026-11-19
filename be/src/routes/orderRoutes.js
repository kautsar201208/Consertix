const express = require("express");
const router = express.Router();

const {
  buatPesanan,
  riwayatPesanan,
  detailPesanan,
  getEventsSummaryAdmin,
  getAllOrdersAdmin,
  checkInTiket,
  getTicketStatus,
  resetScannedTickets,
  getGateStats,
} = require("../controllers/orderController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// Admin routes (diletakkan sebelum /:id)
router.get("/admin/events-summary", auth, admin, getEventsSummaryAdmin);
router.get("/admin/all", auth, admin, getAllOrdersAdmin);

// Scan checkin di gate konser (terbuka agar staff gate tidak terblokir expired token)
router.post("/scan-checkin", checkInTiket);
router.post("/scan-reset", resetScannedTickets);
router.get("/gate-stats", getGateStats);

// Public / User ticket status check (polling oleh aplikasi mobile)
router.get("/ticket-status/:code", getTicketStatus);

// User & shared routes
router.post("/", auth, buatPesanan);
router.get("/", auth, riwayatPesanan);
router.get("/:id", auth, detailPesanan);

module.exports = router;
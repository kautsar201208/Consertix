const express = require("express");
const router = express.Router();

const {
  uploadPembayaran,
  getPembayaran,
  verifikasiPembayaran,
  createMidtransTransaction,
  handleMidtransNotification,
  checkMidtransStatus,
  simulateSandboxPayment,
} = require("../controllers/paymentController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const uploadPayment = require("../middleware/uploadPayment");

// Midtrans Snap Token (User order)
router.post("/midtrans-token", auth, createMidtransTransaction);

// Cek Status Transaksi Midtrans (polling dari mobile)
router.get("/midtrans-status/:midtrans_order_id", auth, checkMidtransStatus);

// Simulasi Bayar Khusus Sandbox/Testing
router.post("/simulate-sandbox-pay", auth, simulateSandboxPayment);

// Midtrans Webhook Notification (Publik dari server Midtrans)
router.post("/midtrans-notification", handleMidtransNotification);

// User
router.post(
  "/",
  auth,
  uploadPayment.single("bukti_pembayaran"),
  uploadPembayaran
);

// Admin
router.get("/", auth, admin, getPembayaran);

router.put("/:id", auth, admin, verifikasiPembayaran);

module.exports = router;
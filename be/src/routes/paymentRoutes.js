const express = require("express");
const router = express.Router();

const {
  uploadPembayaran,
  getPembayaran,
  verifikasiPembayaran,
} = require("../controllers/paymentController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const uploadPayment = require("../middleware/uploadPayment");

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
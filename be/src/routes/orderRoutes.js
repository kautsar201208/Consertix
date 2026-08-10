const express = require("express");
const router = express.Router();

const {
  buatPesanan,
  riwayatPesanan,
  detailPesanan,
} = require("../controllers/orderController");

const auth = require("../middleware/authMiddleware");

router.post("/", auth, buatPesanan);
router.get("/", auth, riwayatPesanan);
router.get("/:id", auth, detailPesanan);

module.exports = router;
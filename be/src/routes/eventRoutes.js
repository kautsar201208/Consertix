const express = require("express");
const router = express.Router();

const {
  tambahEvent,
  getEvents,
  getEvent,
  updateEvent,
  hapusEvent,
} = require("../controllers/eventController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const uploadPoster = require("../middleware/uploadPoster");

// User
router.get("/", getEvents);
router.get("/:id", getEvent);

// Admin
router.post("/", auth, admin, uploadPoster.single("poster"), tambahEvent);

router.put("/:id", auth, admin, uploadPoster.single("poster"), updateEvent);

router.delete("/:id", auth, admin, hapusEvent);

module.exports = router;
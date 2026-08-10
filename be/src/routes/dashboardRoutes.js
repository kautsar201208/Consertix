const express = require("express");
const router = express.Router();

const { dashboard } = require("../controllers/dashboardController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.get("/", auth, admin, dashboard);

module.exports = router;
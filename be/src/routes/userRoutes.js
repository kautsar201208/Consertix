const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");

const auth = require("../middleware/authMiddleware");

// Semua route dilindungi oleh auth middleware
router.get("/", auth, getAllUsers);
router.get("/:id", auth, getUserById);
router.put("/:id", auth, updateUserRole);
router.delete("/:id", auth, deleteUser);

module.exports = router;

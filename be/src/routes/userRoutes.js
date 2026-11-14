const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

router.get("/", auth, admin, getAllUsers);
router.get("/:id", auth, admin, getUserById);
router.put("/:id", auth, admin, updateUserRole);
router.delete("/:id", auth, admin, deleteUser);

module.exports = router;

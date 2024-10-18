const express = require("express");
const {
  register,
  login,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");
const {
  authorizeUserOrAdmin,
  authorizeAdmin,
} = require("../middlewares/authorization");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/:id", authMiddleware, authorizeUserOrAdmin, getUser);
router.put("/:id", authMiddleware, authorizeUserOrAdmin, updateUser);
router.delete("/:id", authMiddleware, authorizeAdmin, deleteUser);

module.exports = router;

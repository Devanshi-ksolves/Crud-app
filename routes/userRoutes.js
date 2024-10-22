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
const { forgetPassword } = require("../controllers/forgetPasswordController");
const { validateOtp } = require("../controllers/updatePasswordController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/:id", authMiddleware, authorizeUserOrAdmin, getUser);
router.put("/:id", authMiddleware, authorizeUserOrAdmin, updateUser);
router.delete("/:id", authMiddleware, authorizeAdmin, deleteUser);

router.post("/forgot-password", forgetPassword);
router.post("/validate-otp", validateOtp);

module.exports = router;

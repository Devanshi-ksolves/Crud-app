const express = require("express");
const {
  register,
  login,
  updateUser,
  getUser,
  deleteUser,
  getAllUsers,
  impersonateUser,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");
const {
  authorizeUserOrAdmin,
  authorizeAdmin,
} = require("../middlewares/authorization");
const { forgetPassword } = require("../controllers/forgetPasswordController");
const { validateOtp } = require("../controllers/otpValidationController");
const { resetPassword } = require("../controllers/updatePasswordController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/:id", authMiddleware, authorizeUserOrAdmin, getUser);
router.put("/:id", authMiddleware, authorizeUserOrAdmin, updateUser);
router.delete("/:id", authMiddleware, authorizeAdmin, deleteUser);

router.post("/forgot-password", forgetPassword);
router.post("/validate-otp", validateOtp);
router.post("/reset-password", resetPassword);
router.get("/", authMiddleware, authorizeAdmin, getAllUsers);
router.post(
  "/impersonate/:id",
  authMiddleware,
  authorizeAdmin,
  impersonateUser
);

module.exports = router;

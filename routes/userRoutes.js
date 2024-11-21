const express = require("express");
const {
  register,
  login,
  updateUser,
  getUser,
  deleteUser,
  getAllUsers,
  impersonateUser,
  uploadFiles,
  getUsersList,
  requestDocument,
  viewDocuments,
  acceptRejectDocument,
  uploadDocument,
  getRequestedDocuments,
  getUsersWithDocuments,
  getUserDocuments,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/auth");
const {
  authorizeUserOrAdmin,
  authorizeAdmin,
} = require("../middlewares/authorization");
const { forgetPassword } = require("../controllers/forgetPasswordController");
const { validateOtp } = require("../controllers/otpValidationController");
const { resetPassword } = require("../controllers/updatePasswordController");
const upload = require("../middlewares/upload");
const router = express.Router();
router.get(
  "/users-with-documents",
  authMiddleware,
  authorizeUserOrAdmin,
  getUsersWithDocuments
);
router.get("/requested-documents/:userId", getRequestedDocuments);

router.post("/register", register);
router.post("/login", login);
router.get("/users", authMiddleware, authorizeAdmin, getUsersList);

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
router.post(
  "/upload-files",
  authMiddleware,
  upload.fields([
    { name: "document", maxCount: 1 },
    { name: "profilePicture", maxCount: 2 },
  ]),
  uploadFiles
);

router.post(
  "/request-document",
  authMiddleware,
  authorizeUserOrAdmin,
  requestDocument
);

router.get("/view-documents/:id", viewDocuments);
router.post(
  "/accept-reject-document",
  authMiddleware,
  authorizeUserOrAdmin,
  acceptRejectDocument
);
router.post(
  "/upload-document",
  authMiddleware,
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
  ]),
  uploadDocument
);

router.get(
  "/user/:userId/documents",
  authMiddleware,
  authorizeUserOrAdmin,
  getUserDocuments
);

module.exports = router;

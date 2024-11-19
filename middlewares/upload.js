const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "document") {
      cb(null, "uploads/documents");
    } else if (file.fieldname === "profilePicture") {
      cb(null, "uploads/profile_pictures");
    } else if (file.fieldname === "frontImage") {
      cb(null, "uploads/frontImage");
    } else if (file.fieldname === "backImage") {
      cb(null, "uploads/backImage");
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPG, PNG, and PDF files are allowed.")
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = upload;

const { User, Document } = require("../models");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const jwt = require("jsonwebtoken");
const path = require("path");
const { sendEmail } = require("../services/emailService");

const parsePrivileges = (role, privilegesString) => {
  const allPrivileges = ["Assign Roles", "Delete User", "Impersonate User"];

  if (role === "super_admin") {
    return allPrivileges;
  }

  if (Array.isArray(privilegesString)) {
    return privilegesString;
  }

  if (typeof privilegesString === "string") {
    return privilegesString
      .split(",")
      .map((privilege) => privilege.trim())
      .filter((privilege) => privilege !== "");
  }

  return [];
};

exports.register = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !user.validatePassword(password)) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const privileges = parsePrivileges(user.role, user.privileges);
  const canImpersonate = privileges.includes("Impersonate User");

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      isAdmin: user.role === "admin",
      isSuperAdmin: user.role === "super_admin",
      privileges,
      canImpersonate,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, role: user.role, privileges, canImpersonate });
};

exports.getUser = async (req, res) => {
  const userId = req.params.id || req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const privileges = parsePrivileges(user.role, user.privileges);

    const canImpersonate = user.role === "super_admin" || user.role === "admin";

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      privileges,
      canImpersonate,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  const { role, password, ...otherUpdates } = req.body;

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      req.user.id !== user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own profile." });
    }
    if (
      req.user.role !== "super_admin" &&
      req.user.id !== user.id &&
      !parsePrivileges(req.user.role, req.user.privileges).includes(
        "Assign Roles"
      )
    ) {
      return res.status(403).json({
        message: "Forbidden: You do not have role assignment privileges",
      });
    }
    if (
      req.user.role === "admin" ||
      (req.user.role === "super_admin" && role)
    ) {
      user.role = role;
    }

    if (password) {
      user.password = await User.hashPassword(password);
    }

    await user.update({
      ...otherUpdates,
      password: user.password,
      role: user.role,
    });

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: You are not authorized to delete users" });
    }

    if (
      !parsePrivileges(req.user.role, req.user.privileges).includes(
        "Delete User"
      )
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have delete privileges" });
    }

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  const { search = "", page = 1, pageSize = 10 } = req.query;

  const currentPage = search ? 1 : parseInt(page, 10) || 1;
  const limit = parseInt(pageSize, 10) || 10;
  const offset = (currentPage - 1) * limit;

  try {
    const searchFilter = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const users = await User.findAll({
      where: searchFilter,
      limit: limit,
      offset: offset,
      order: [["name", "ASC"]],
    });

    const totalUsers = await User.count({
      where: searchFilter,
    });

    res.json({
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

exports.impersonateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const userToImpersonate = await User.findByPk(id);
    if (!userToImpersonate) {
      return res.status(404).json({ message: "User not found" });
    }

    const privileges = parsePrivileges(req.user.role, req.user.privileges);
    const canImpersonate = privileges.includes("Impersonate User");

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Only admins can impersonate users." });
    }

    if (!canImpersonate) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have impersonate privileges" });
    }

    const token = jwt.sign(
      {
        id: userToImpersonate.id,
        role: userToImpersonate.role,
        isAdmin: userToImpersonate.role === "admin",
        isSuperAdmin: userToImpersonate.role === "super_admin",
        privileges: userToImpersonate.privileges
          ? userToImpersonate.privileges.split(",")
          : [],
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log(`Impersonating user ${userToImpersonate.name}`);

    res.json({
      message: `Impersonating user ${userToImpersonate.name}`,
      token,
      role: userToImpersonate.role,
    });
  } catch (err) {
    console.error("Impersonation error:", err);
    res.status(400).json({ error: err.message });
  }
};

exports.uploadFiles = async (req, res) => {
  if (req.files) {
    const profilePicture = req.files.profilePicture
      ? req.files.profilePicture[0].path
      : null;
    const document = req.files.document ? req.files.document[0].path : null;

    const userId = req.user.id;
    if (!profilePicture) {
      return res.status(400).json({ message: "No profile picture uploaded" });
    }
    if (!document) {
      return res.status(400).json({ message: "No document uploaded" });
    }

    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await user.update({
        profilePicture: profilePicture,
        document: document,
      });

      res.status(200).json({
        message: "Files uploaded successfully",
        profilePicture: profilePicture,
        document: document,
      });
    } catch (err) {
      console.error("Error updating profile picture and document path", err);
      res.status(500).json({
        message:
          "Error updating profile picture and document path in the database",
        error: err.message,
      });
    }
  } else {
    res.status(400).json({ message: "No files uploaded" });
  }
};

exports.getUsersList = async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;

  const currentPage = parseInt(page, 10) || 1;
  const limit = parseInt(pageSize, 10) || 10;
  const offset = (currentPage - 1) * limit;

  try {
    const users = await User.findAll({
      where: { role: "user" },
      limit: limit,
      offset: offset,
      order: [["id", "ASC"]],
    });

    const totalUsers = await User.count({
      where: { role: "user" },
    });

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      totalPages: totalPages,
      currentPage: currentPage,
      totalUsers: totalUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

exports.requestDocument = async (req, res) => {
  const { userId, documentTypes } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    for (const type of documentTypes) {
      await Document.create({ userId, documentType: type });
    }

    const documentList = documentTypes.map((type) => `- ${type}`).join("\n");
    const emailContent = `
Dear ${user.name},

We are reaching out to inform you that the following documents are required for processing your request:

${documentList}

Please upload these documents at your earliest convenience. Your prompt response will help us to process your request smoothly and efficiently.

Thank you for your cooperation.

Best regards,
Curd_App Team
`;

    await sendEmail(user.email, "Document Request", emailContent);

    res.status(200).json({ message: "Document request sent to user." });
  } catch (error) {
    console.error("Error requesting documents:", error);
    res.status(500).json({ message: "Error requesting documents." });
  }
};

exports.viewDocuments = async (req, res) => {
  const userId = req.params.id;

  try {
    const documents = await Document.findAll({ where: { userId } });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching documents." });
  }
};

exports.acceptRejectDocument = async (req, res) => {
  const { documentId, status } = req.body;

  try {
    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    document.status = status;
    await document.save();

    if (status === "rejected") {
      document.uploaded = false;
      await document.save();

      const user = await User.findByPk(document.userId);
      if (user) {
        const documentName = document.documentType;
        const subject = "Document Rejection Notification";
        const message = `
          Dear ${user.name},

          We regret to inform you that the document titled "${documentName}" has been rejected due to non-compliance with our submission guidelines. 
          
          Please review the document and make the necessary corrections before re-uploading it. 

          If you have any questions or need further assistance, feel free to contact our support team.

          Best regards,
          Crud App Support Team
        `;

        sendEmail(user.email, subject, message);
      }
    }

    return res.status(200).json({ message: `Document ${status}` });
  } catch (error) {
    console.error("Error updating document status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.uploadDocument = async (req, res) => {
  if (req.files) {
    const frontImage = req.files.frontImage
      ? req.files.frontImage[0].path
      : null;
    const backImage = req.files.backImage ? req.files.backImage[0].path : null;

    try {
      const { documentId, userId } = req.body;

      console.log("Document ID:", documentId);
      console.log("User ID:", userId);

      const document = await Document.findOne({
        where: { id: documentId, userId },
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      document.uploaded = true;
      document.status = "uploaded";
      document.frontImage = frontImage;
      document.backImage = backImage;

      const savedDocument = await document.save();

      res.status(200).json({
        message: "Files uploaded successfully",
        frontImage: savedDocument.frontImage,
        backImage: savedDocument.backImage,
        documentId: savedDocument.id,
        status: savedDocument.status,
      });
    } catch (err) {
      console.error("Error saving document:", err.message);
      res.status(500).json({
        message: "Error updating document paths in the database",
        error: err.message,
      });
    }
  } else {
    res.status(400).json({ message: "No files uploaded" });
  }
};

exports.getRequestedDocuments = async (req, res) => {
  const { userId } = req.params;
  try {
    const latestDocument = await Document.findOne({
      where: { userId },
      order: [["createdAt", "DESC"]],
      attributes: ["createdAt"],
    });

    if (!latestDocument) {
      return res
        .status(404)
        .json({ message: "No documents found for this user." });
    }

    const latestTimestamp = latestDocument.createdAt;

    const recentDocuments = await Document.findAll({
      where: { userId, createdAt: latestTimestamp },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(recentDocuments);
  } catch (error) {
    console.error(
      "Error fetching the latest requested documents:",
      error.message
    );
    res.status(500).json({ message: "Error fetching documents." });
  }
};
exports.getUsersWithDocuments = async (req, res) => {
  try {
    console.log("Fetching users with documents...");

    const usersWithDocuments = await User.findAll({
      include: [
        {
          model: Document,
          as: "documents",
          attributes: ["id", "documentType", "status", "createdAt", "uploaded"],
        },
      ],
      where: {
        "$documents.userId$": { [Sequelize.Op.ne]: null },
      },
    });

    if (!usersWithDocuments || usersWithDocuments.length === 0) {
      console.log("No users with documents found.");
      return res
        .status(404)
        .json({ message: "No users with documents found." });
    }

    res.status(200).json(usersWithDocuments);
  } catch (error) {
    console.error("Error fetching users with documents:", error.message);
    res.status(500).json({ message: "Error fetching users with documents." });
  }
};

exports.getUserDocuments = async (req, res) => {
  const { userId } = req.params;
  const { uploaded, status } = req.query;

  try {
    const whereConditions = { userId };
    if (uploaded !== undefined) whereConditions.uploaded = uploaded;
    if (status) whereConditions.status = status;

    const userDocuments = await Document.findAll({
      where: whereConditions,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "frontImage", "backImage", "status", "documentType"],
    });

    if (!userDocuments || userDocuments.length === 0) {
      return res
        .status(404)
        .json({ message: "No documents found for this user." });
    }

    const baseUrl = "http://localhost:3000"; 

    userDocuments.forEach((doc) => {
      doc.frontImage = new URL(doc.frontImage, baseUrl).toString();
      doc.backImage = new URL(doc.backImage, baseUrl).toString();
    });

    res.status(200).json(userDocuments);
  } catch (error) {
    console.error("Error fetching user documents:", error.message);
    res.status(500).json({ message: "Error fetching user documents." });
  }
};

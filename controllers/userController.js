const { User, Op } = require("../models");
const jwt = require("jsonwebtoken");
const path = require("path");

const parsePrivileges = (role, privilegesString) => {
  const allPrivileges = [
    "Assign Roles",
    "Delete User",
    "Impersonate User",
  ];

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
    const { privileges = [] } = req.body; 
    req.body.privileges = Array.isArray(privileges)
      ? privileges
      : privileges.split(",").map((priv) => priv.trim()); 

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

    const canImpersonate = user.role === "super_admin" || user.role === "admin"; // Example condition

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

  const currentPage = parseInt(page, 10) || 1;
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
      order: [["id", "ASC"]],
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

exports.uploadFiles = (req, res) => {
  if (req.files) {
    const document = req.files.document ? req.files.document[0].path : null;
    const profilePicture = req.files.profilePicture
      ? req.files.profilePicture[0].path
      : null;

    res.status(200).json({
      message: "Files uploaded successfully",
      documentPath: document,
      profilePicturePath: profilePicture,
    });
  } else {
    res.status(400).json({ message: "No files uploaded" });
  }
};

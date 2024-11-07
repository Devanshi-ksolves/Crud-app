const { User, Op } = require("../models");
const jwt = require("jsonwebtoken");

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

  const token = jwt.sign(
    { id: user.id, role: user.role, isAdmin: user.role === "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  res.json({ token, role: user.role });
};
exports.getUser = async (req, res) => {
  const userId = req.params.id || req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the required user fields including profilePicture and document
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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

    if (req.user.id !== user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own profile." });
    }

    if (req.user.role === "admin" && role) {
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

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Only admins can impersonate users." });
    }

    const token = jwt.sign(
      {
        id: userToImpersonate.id,
        role: userToImpersonate.role,
        isAdmin: userToImpersonate.role === "admin",
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

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

const authorizeUserOrAdmin = (req, res, next) => {
  const { id } = req.params;
  if (req.user.role !== "admin" && req.user.id != id) {
    return res
      .status(403)
      .json({ message: "Forbidden: Cannot access others data" });
  }
  next();
};

module.exports = { authorizeAdmin, authorizeUserOrAdmin };

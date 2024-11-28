require("dotenv").config();
const express = require("express");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socket = require("./sockets/socket");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

const server = http.createServer(app);

socket.init(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

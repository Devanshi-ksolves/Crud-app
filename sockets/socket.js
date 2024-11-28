const { Server } = require("socket.io");

let io;

const userConnections = new Map(); 

module.exports = {
  init: (server) => {
    io = new Server(server, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.on("register", (userId) => {
        if (userId) {
          userConnections.set(userId, socket.id);
          console.log(`User registered: ${userId} -> ${socket.id}`);
        } else {
          console.warn("Register event received without userId");
        }
      });

      socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        for (const [userId, socketId] of userConnections.entries()) {
          if (socketId === socket.id) {
            userConnections.delete(userId);
            console.log(`User unregistered: ${userId}`);
            break;
          }
        }
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },

  notifyAdmin: (adminId, message, link) => {
    const adminSocketId = userConnections.get(adminId);
    if (adminSocketId) {
      io.to(adminSocketId).emit("notification", { message, link });
      console.log(`Notification sent to admin ${adminId}: ${message}`);
    } else {
      console.warn(`Admin with ID ${adminId} is not connected.`);
    }
  },
};

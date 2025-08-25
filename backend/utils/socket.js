const { Server } = require('socket.io');

let io;
require('dotenv').config();
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors:
    {
      // origin: process.env.ADMIN_PANEL_URL, // Your frontend URL
      origin: "*",
      methods: ["GET", "POST"],
      // credentials: true,
      credentials: false,
    },
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle admin registration
    socket.on('register-admin', () => {
      console.log('Admin registered:', socket.id);
      socket.join('admins'); // Add admin to "admins" room
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
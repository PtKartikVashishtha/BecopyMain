const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { initSocket } = require('./utils/socket');

const dbConnect = require('./config/mongoose');

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);




// Store admin connections
const adminSockets = new Set();

// Socket connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle admin registration
  socket.on('register-admin', () => {
    console.log('Admin registered:', socket.id);
    adminSockets.add(socket.id);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    adminSockets.delete(socket.id);
  });
});

// Create notification function
const notifyAdmins = (type, data) => {
  // console.log('Notifying admins:', type, data);
  // io.sockets.sockets.forEach(socket => {
  //   if (adminSockets.has(socket.id)) {
  io.emit('admin-notification', {
    type,
    data,
    timestamp: new Date()
  });
  //   }
  // });
};
require('dotenv').config();
// Define the allowed origins
const allowedOrigins = [process.env.ADMIN_PANEL_URL, process.env.FRONTEND_URL];

// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or Postman)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.indexOf(origin) !== -1) {
//       // Origin is allowed
//       callback(null, true);
//     } else {
//       // Origin is not allowed
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true, // Allow cookies and credentials
// }));
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const routes = require('./routes');

// Routes
app.use('/', routes);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

dbConnect();

// Export io to use in controllers
module.exports = { app, httpServer, io, notifyAdmins };
const { getIO } = require('./socket');

const emitToAdmins = (type, data) => {
  const io = getIO(); // Get the initialized io instance
  io.to('admins').emit('admin-notification', {
    type,
    data,
    timestamp: new Date(),
  });
};

module.exports = { emitToAdmins };
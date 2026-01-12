const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const db = require('./src/models');
require('dotenv').config();

const seedRoles = require('./src/seeders/seedRoles');
const seedAdminUsers = require('./src/seeders/seedAdminUsers');
const seedPermissions = require('./src/seeders/seedPermissions');

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.DOMAIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const onlineUsers = new Map();

// Logika Realtime Chat (Socket.io)
io.on('connection', (socket) => {
  // console.log('⚡ User connected to Socket:', socket.id);
  socket.on('user_connected', (userId) => {
    if (userId) {
      onlineUsers.set(String(userId), socket.id);
      io.emit('user_status_update', { userId, isOnline: true });
      io.emit('get_online_users', Array.from(onlineUsers.keys()));
    }
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    // console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { room_id, sender_role, message, type = 'text' } = data;
      const savedMessage = await db.RealtimeMessage.create({
        room_id,
        sender_role,
        message,
        type,
        is_read: false,
      });

      const room = await db.ChatRoom.findByPk(room_id);
      if (room) {
        let readableMessage = message;
        if (type === 'image') readableMessage = '📷 [Gambar]';
        if (type === 'custom_product') readableMessage = '🛍️ Pesanan Custom';

        room.last_message = readableMessage;

        if (sender_role === 'user') {
          room.unread_count_admin = (room.unread_count_admin || 0) + 1;
        } else {
          room.unread_count_user = (room.unread_count_user || 0) + 1;
        }
        room.changed('updatedAt', true);
        await room.save();
      }

      io.in(room_id).emit('receive_message', savedMessage);
      io.emit('update_room_list');
    } catch (error) {
      console.error('Socket Error (send_message):', error);
    }
  });

  socket.on('disconnect', () => {
    // console.log('User disconnected form Socket:', socket.id);
    let disconnectedUserId = null;
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        disconnectedUserId = uid;
        break;
      }
    }

    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      io.emit('user_status_update', { userId: disconnectedUserId, isOnline: false });
      io.emit('get_online_users', Array.from(onlineUsers.keys()));
    }
  });

  socket.on('delete_message_event', (data) => {
    socket.to(data.roomId).emit('message_deleted', data.messageId);
    io.emit('update_room_list');
  });

  socket.on('clear_chat_event', (roomId) => {
    socket.to(roomId).emit('chat_cleared');
  });
});

// Jalankan Server
(async () => {
  try {
    await db.sequelize.sync().then(() => {
      console.log('Database synced');
    });

    await seedRoles();
    await seedAdminUsers();
    await seedPermissions();
    console.log('✅ All seeders executed successfully');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
})();

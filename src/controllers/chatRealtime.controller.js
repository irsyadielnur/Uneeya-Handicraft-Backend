const { ChatRoom, RealtimeMessage, User } = require('../models');

exports.getMyChatRoom = async (req, res) => {
  try {
    const userId = req.user.user_id;

    let [room, created] = await ChatRoom.findOrCreate({
      where: { user_id: userId },
      defaults: {
        last_message: 'Halo Admin!',
        unread_count_user: 0,
        unread_count_admin: 1,
      },
    });
    const messages = await RealtimeMessage.findAll({
      where: { room_id: room.chatroom_id },
      order: [['createdAt', 'ASC']],
    });
    if (room.unread_count_user > 0) {
      room.unread_count_user = 0;
      await room.save();
    }
    res.json({ room, messages });
  } catch (error) {
    console.error('Error Get My Room:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'username', 'email', 'profile_pic'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAdminChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findByPk(roomId, {
      include: [{ model: User, as: 'user', attributes: ['username'] }],
    });

    if (!room) return res.status(404).json({ message: 'Room not found' });
    const messages = await RealtimeMessage.findAll({
      where: { room_id: roomId },
      order: [['createdAt', 'ASC']],
    });

    if (room.unread_count_admin > 0) {
      room.unread_count_admin = 0;
      await room.save();
    }

    res.json({ room, messages });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.uploadChatImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const imageUrl = req.file.path;
  res.json({ url: imageUrl });
};

// Hapus satu pesan
exports.deleteSingleMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await RealtimeMessage.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Pesan tidak ditemukan' });
    }

    const roomId = message.room_id;
    await message.destroy();

    const room = await ChatRoom.findByPk(roomId);
    if (room) {
      const lastMsg = await RealtimeMessage.findOne({
        where: { room_id: roomId },
        order: [['createdAt', 'DESC']],
      });

      if (!lastMsg) {
        room.last_message = '';
      } else {
        if (lastMsg.type === 'image') room.last_message = '📷 [Gambar]';
        else if (lastMsg.type === 'custom_product') room.last_message = '🛍️ Pesanan Custom';
        else room.last_message = lastMsg.message;
      }
      const unreadAdmin = await RealtimeMessage.count({
        where: { room_id: roomId, sender_role: 'user', is_read: false },
      });

      const unreadUser = await RealtimeMessage.count({
        where: { room_id: roomId, sender_role: 'admin', is_read: false },
      });

      room.unread_count_admin = unreadAdmin;
      room.unread_count_user = unreadUser;

      await room.save();
    }

    res.json({ message: 'Pesan dihapus', deletedId: messageId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus pesan' });
  }
};

// Hapus semua pesan
exports.clearChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    await RealtimeMessage.destroy({
      where: { room_id: roomId },
    });

    res.json({ message: 'Chat berhasil dibersihkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal membersihkan chat' });
  }
};

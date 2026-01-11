const express = require('express');
const router = express.Router();
const chatRealtimeController = require('../controllers/chatRealtime.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');
const uploadChatImg = require('../middlewares/chatImg.middleware');

// User Routes
router.get('/my-room', auth, chatRealtimeController.getMyChatRoom);

// Admin - Owner Routes
router.get('/admin/rooms', auth, authorize('chat_customers'), chatRealtimeController.getAllRooms);
router.get('/admin/rooms/:roomId', auth, authorize('chat_customers'), chatRealtimeController.getAdminChatRoom);

// Route upload gambar
router.post('/upload', auth, uploadChatImg.single('image'), chatRealtimeController.uploadChatImage);

// Route delete message
router.delete('/message/:messageId', auth, chatRealtimeController.deleteSingleMessage);
router.delete('/room/:roomId', auth, chatRealtimeController.clearChatRoom);

module.exports = router;

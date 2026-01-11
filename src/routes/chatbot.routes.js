const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const strictAuth = require('../middlewares/auth.middleware');
const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    console.log('OptionalAuth: User ID detected =', decoded.user_id);
  } catch (err) {
    console.log('OptionalAuth: Token invalid, treating as Guest.');
    req.user = null;
  }
  next();
};

router.post('/send', optionalAuth, chatbotController.chatbot);
router.get('/history', strictAuth, chatbotController.getChatHistory);
router.delete('/history', strictAuth, chatbotController.deleteChatHistory);

module.exports = router;

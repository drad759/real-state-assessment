const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { startChat, sendMessage } = require('../controllers/chatController');

router.post('/:leadId/start', authenticate, startChat);
router.post('/:leadId/send', authenticate, sendMessage);

module.exports = router;
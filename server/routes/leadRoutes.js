const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { createLead, getLeads, getLeadDetails } = require('../controllers/leadController');

router.post('/', authenticate, createLead);
router.get('/', authenticate, getLeads);
router.get('/:leadId', authenticate, getLeadDetails);

module.exports = router;
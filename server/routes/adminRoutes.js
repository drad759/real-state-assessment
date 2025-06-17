const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { getDashboardStats, createUser } = require('../controllers/adminController');

router.get('/dashboard', authenticate, authorize(['admin']), getDashboardStats);
router.post('/users', authenticate, authorize(['admin']), createUser);

module.exports = router;
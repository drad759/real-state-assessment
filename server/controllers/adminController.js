const Lead = require('../models/Lead');
const User = require('../models/User');

async function getDashboardStats(req, res) {
  try {
    const totalLeads = await Lead.countDocuments();
    const hotLeads = await Lead.countDocuments({ classification: 'hot' });
    const coldLeads = await Lead.countDocuments({ classification: 'cold' });
    const invalidLeads = await Lead.countDocuments({ classification: 'invalid' });
    
    res.json({
      totalLeads,
      hotLeads,
      coldLeads,
      invalidLeads
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

async function createUser(req, res) {
  try {
    const { username, password, role } = req.body;
    
    const user = new User({
      username,
      password, 
      role
    });
    
    await user.save();
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

module.exports = { getDashboardStats, createUser };
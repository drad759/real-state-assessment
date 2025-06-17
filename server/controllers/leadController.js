const Lead = require('../models/Lead');
const Chat = require('../models/Chat');

async function createLead(req, res) {
  try {
    const { name, phone, source, initialMessage, businessIndustry } = req.body;
    
    const lead = new Lead({
      name,
      phone,
      source,
      initialMessage,
      businessIndustry
    });
    
    await lead.save();
    
    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
}

async function getLeads(req, res) {
  try {
    const { status, classification } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (classification) filter.classification = classification;
    
    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
}

async function getLeadDetails(req, res) {
  try {
    const { leadId } = req.params;
    
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const chat = await Chat.findOne({ leadId });
    
    res.json({
      lead,
      chat
    });
  } catch (error) {
    console.error('Error fetching lead details:', error);
    res.status(500).json({ error: 'Failed to fetch lead details' });
  }
}

module.exports = { createLead, getLeads, getLeadDetails };
const Chat = require('../models/Chat');
const Lead = require('../models/Lead');
const { generateResponse } = require('../services/geminiService');
const { qualifyLead } = require('../services/qualificationService');
const config = require('../config');

async function startChat(req, res) {
  try {
    const { leadId } = req.params;
    
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const businessProfile = config.getBusinessProfile(lead.businessIndustry);
    const greeting = businessProfile.initialGreeting.replace('{name}', lead.name);
    
    let chat = await Chat.findOne({ leadId, isActive: true });
    
    if (!chat) {
      chat = new Chat({
        leadId,
        messages: [{
          sender: 'bot',
          content: greeting
        }]
      });
      await chat.save();
      
      lead.status = 'contacted';
      await lead.save();
    }
    
    res.json(chat);
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ error: 'Failed to start chat' });
  }
}

async function sendMessage(req, res) {
  try {
    const { leadId } = req.params;
    const { content } = req.body;
    
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    let chat = await Chat.findOne({ leadId, isActive: true });
    if (!chat) {
      return res.status(400).json({ error: 'No active chat for this lead' });
    }
    
    // Add user message
    chat.messages.push({
      sender: 'user',
      content
    });
    
    const businessProfile = config.getBusinessProfile(lead.businessIndustry);
    
    // Generate bot response
    const botResponse = await generateResponse(chat.messages, businessProfile);
    chat.messages.push({
      sender: 'bot',
      content: botResponse
    });
    
    await chat.save();
    
    // Update lead metadata if we've extracted any info
    updateLeadMetadata(lead, chat.messages, businessProfile);
    
    // Re-classify lead
    const qualification = await qualifyLead(lead.metadata, businessProfile);
    lead.classification = qualification.classification;
    lead.qualificationReason = qualification.reason;
    await lead.save();
    
    res.json(chat);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

function updateLeadMetadata(lead, messages, businessProfile) {
  const conversationHistory = messages.map(msg => `${msg.sender}: ${msg.content}`).join('\n');
  const lastUserMessage = messages.filter(m => m.sender === 'user').pop()?.content || '';
  
  // Initialize metadata if not exists
  lead.metadata = lead.metadata || {};
  
  // Core real estate fields extraction
  const propertyTypeMatch = lastUserMessage.match(/(apartment|flat|villa|house|plot|land|commercial|residential)/i);
  const budgetMatch = lastUserMessage.match(/(\d+\s*(lakh|lac|cr|crore|thousand|k|million|mn)|₹\s*\d+|rs\.?\s*\d+|\$\s*\d+)/i);
  const locationMatch = lastUserMessage.match(/(in|at|near|around|close to|within)\s+([\w\s]+?)(?=\s|$|,|\.)/i);
  const timelineMatch = lastUserMessage.match(/(immediate|urgent|soon|within \d+\s*(days|weeks|months)|right away|asap)/i);
  const amenitiesMatch = lastUserMessage.match(/(school|hospital|metro|station|market|mall|park|highway|road|connectivity|amenities)/gi);
  const sizeMatch = lastUserMessage.match(/(\d+)\s*(sq\s*ft|square feet|sqft|sq yard|sq m|square meter|acre|gunta)/i);
  const intentMatch = lastUserMessage.match(/(invest|investment|buy|purchase|own|live in|shift|move|relocate)/i);

  // Update metadata with extracted values
  if (propertyTypeMatch) {
    lead.metadata.propertyType = propertyTypeMatch[0].toLowerCase();
  }
  
  if (budgetMatch) {
    lead.metadata.budget = budgetMatch[0].replace(/\s+/g, ' ').trim();
    // Convert all budgets to standard format (e.g., "70 lakhs")
    lead.metadata.budget = lead.metadata.budget
      .replace(/lac/gi, 'lakh')
      .replace(/rs\.?|₹|\$/gi, '')
      .replace(/k/gi, ' thousand')
      .replace(/mn/gi, ' million')
      .trim();
  }
  
  if (locationMatch) {
    lead.metadata.location = locationMatch[2].trim();
    // Special case for Mumbai
    if (lastUserMessage.match(/mumbai|bombay/i)) {
      lead.metadata.location = 'Mumbai';
      // Extract specific areas
      const mumbaiAreaMatch = lastUserMessage.match(/(bandra|andheri|powai|thane|navi mumbai|lower parel|worli|dadar)/i);
      if (mumbaiAreaMatch) {
        lead.metadata.specificArea = mumbaiAreaMatch[0];
      }
    }
  }
  
  if (timelineMatch) {
    lead.metadata.timeline = timelineMatch[0].toLowerCase();
    lead.metadata.urgency = timelineMatch[0].includes('immediate') || 
                           timelineMatch[0].includes('urgent') || 
                           timelineMatch[0].includes('asap') ? 'high' : 'medium';
  }
  
  if (amenitiesMatch) {
    lead.metadata.amenities = [...new Set(amenitiesMatch.map(a => a.toLowerCase()))];
  }
  
  if (sizeMatch) {
    lead.metadata.propertySize = `${sizeMatch[1]} ${sizeMatch[2].replace(/\s+/g, '')}`;
  }
  
  if (intentMatch) {
    lead.metadata.purchaseIntent = intentMatch[0].toLowerCase();
    lead.metadata.isInvestment = /invest|investment/i.test(intentMatch[0]);
  }
  
  // Conversation analysis flags
  lead.metadata.hasDetailedRequirements = messages.some(m => 
    m.sender === 'user' && m.content.split(' ').length > 15
  );
  
  lead.metadata.engagementLevel = messages.filter(m => m.sender === 'user').length;
  
  // Full conversation context for AI analysis
  lead.metadata.conversationSummary = conversationHistory;
  lead.metadata.lastMessage = lastUserMessage;
  lead.metadata.lastMessageLength = lastUserMessage.split(' ').length;
  
  // Timestamp updates
  lead.metadata.lastUpdated = new Date();
  if (!lead.metadata.firstContact) {
    lead.metadata.firstContact = new Date();
  }
}

module.exports = { startChat, sendMessage };
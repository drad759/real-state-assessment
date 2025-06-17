const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  initialMessage: String,
  status: { 
    type: String, 
    enum: ['new', 'contacted', 'qualified', 'converted', 'invalid'], 
    default: 'new' 
  },
  classification: {
    type: String,
    enum: ['hot', 'cold', 'invalid'],
    default: 'invalid'
  },
  metadata: {
    propertyType: String,
    budget: String,
    location: String,
    timeline: String
  },
  businessIndustry: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);
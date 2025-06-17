const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function qualifyLead(metadata, businessProfile) {
  const prompt = `
  You are a lead qualification expert for a ${businessProfile.industry} business.
  Analyze the following lead metadata and determine if the lead is:
  - "hot": Highly interested, ready to buy, good fit
  
  - "cold": Not currently interested or poor fit but can be in future or having some suspense
  - "invalid": Spam or completely irrelevant
  
  Consider these factors in your evaluation:
  1. Completeness of information provided
  2. Urgency/timeline expressed
  3. Budget alignment with business offerings
  4. Specificity of requirements
  5. Engagement level in conversation
  
  Business Profile:
  ${JSON.stringify(businessProfile, null, 2)}
  
  Lead Metadata:
  ${JSON.stringify(metadata, null, 2)}
  
  Provide your classification with a one-word response (hot/warm/cold/invalid) and 
  a VERY brief (5-10 word) justification.
  
  Response format:
  classification: [your classification]
  reason: [brief reason]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response
    const classificationMatch = text.match(/classification:\s*(hot|cold|invalid)/i);
    const reasonMatch = text.match(/reason:\s*(.*)/i);
    
    return {
      classification: classificationMatch ? classificationMatch[1].toLowerCase() : 'cold',
      reason: reasonMatch ? reasonMatch[1] : 'Unable to determine'
    };
  } catch (error) {
    console.error('Error qualifying lead:', error);
    return {
      classification: 'cold',
      reason: 'Error in qualification'
    };
  }
}

module.exports = { qualifyLead };
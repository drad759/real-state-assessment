const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generateResponse(chatHistory, businessProfile) {
  const prompt = `
  You are a sales assistant for a ${businessProfile.industry} business. 
  Your goal is to qualify leads by asking relevant questions in a natural, conversational way.
  
  Business Profile:
  ${JSON.stringify(businessProfile, null, 2)}
  
  Chat History:
  ${chatHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}
  
  Based on the conversation so far, generate an appropriate response that:
  1. Moves the conversation forward to qualify the lead
  2. Asks relevant questions to gather missing information
  3. Sounds natural and empathetic
  4. Avoids sounding robotic or like a questionnaire
  
  Respond only with the message content (no prefixes or formatting).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    return businessProfile.fallbackResponse;
  }
}

module.exports = { generateResponse };
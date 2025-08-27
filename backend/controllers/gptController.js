const axios = require('axios');
const { response } = require('express');
const OpenAI = require('openai')

const convertCode = async (req, res) => {
  const { convertTo, code } = req.body
  if (!convertTo || !code) return res.status(400).json({ message: 'Invalid Data' })

  try {
    require('dotenv').config();
    console.log('Converting Code')
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Or replace with your API key directly
    });
    
    const prompt = `Convert the following code to ${convertTo}:\n\n${code}\n\n${convertTo} code:`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo"
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0,
    });
    
    const convertedCode = response.choices[0].message.content;
    
    res.status(200).json({ convertTo, code: convertedCode });
  } catch (err) {
    const errorData = err.response?.data || err.message || err;
    console.error('OpenAI API Error:', errorData);
    res.status(500).json({
      message: 'Something went wrong',
      error: errorData,
    });
  }
}

const chatWithGPT = async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  
  if (!message) return res.status(400).json({ message: 'Message is required' });

  try {
    require('dotenv').config();
    console.log('Chat with GPT');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: "You are a helpful programming assistant. Provide clear, concise answers and code examples when relevant." },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = response.choices[0].message.content;
    
    res.status(200).json({ 
      reply,
      usage: response.usage 
    });
  } catch (err) {
    const errorData = err.response?.data || err.message || err;
    console.error('OpenAI Chat API Error:', errorData);
    res.status(500).json({
      message: 'Something went wrong with chat',
      error: errorData,
    });
  }
}

module.exports = { convertCode, chatWithGPT };
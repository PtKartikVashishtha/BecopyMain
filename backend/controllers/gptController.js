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

module.exports = { convertCode };
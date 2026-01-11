const { GoogleGenerativeAI } = require('@google/generative-ai');

// Setup Gemini --
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

exports.askGeminiChat = async (currentMessage, history = [], systemInstruction = '') => {
  try {
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const fullMessage = `${systemInstruction}\n\nPESAN PENGGUNA SAAT INI: "${currentMessage}"`;
    const result = await chat.sendMessage(fullMessage);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error pada Gemini API:', error);
    return 'Maaf, Cimot sedang kesulitan terhubung ke server otak AI. Boleh ulangi lagi?';
  }
};

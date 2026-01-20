const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY missing in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // ✅ CORRECT MODEL
});

async function generateGeminiJSON(prompt) {
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in Gemini response");

  return JSON.parse(match[0]);
}

module.exports = { generateGeminiJSON };

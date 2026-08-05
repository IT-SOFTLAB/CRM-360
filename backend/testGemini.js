const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

async function main() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not found");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say Hello from CRM-360 AI",
    });

    console.log("================================");
    console.log("Gemini Connected Successfully");
    console.log("================================");
    console.log(response.text);
  } catch (err) {
    console.error(err);
  }
}

main();
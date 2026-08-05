const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing in .env");
}

const gemini = new GoogleGenAI({
  apiKey,
});

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

module.exports = {
  gemini,
  GEMINI_MODEL,
};
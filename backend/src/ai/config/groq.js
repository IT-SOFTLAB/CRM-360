const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "llama-3.3-70b-versatile";
// You can also use:
// "openai/gpt-oss-120b"
// "llama-3.1-8b-instant"

module.exports = {
  groq,
  GROQ_MODEL,
};
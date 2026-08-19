const Groq = require("groq-sdk");
require("dotenv").config();

if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in .env");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.6-27b";

module.exports = {
    groq,
    GROQ_MODEL
};
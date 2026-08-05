const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

async function main() {

    const ai = new GoogleGenAI({

        apiKey: process.env.GEMINI_API_KEY

    });

    const response =
        await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: "Say Hello from CRM-360 AI"

        });

    console.log(response.text);

}

main();
const { groq, GROQ_MODEL } = require("../config/groq");

async function askGroq(prompt) {

    const completion = await groq.chat.completions.create({

        model: GROQ_MODEL,

        messages: [
            {
                role: "system",
                content:
                    "You are CRM-360 AI Assistant."
            },
            {
                role: "user",
                content: prompt
            }
        ],

        temperature: 0.5,

        max_tokens: 500
    });

    return completion.choices[0].message.content;
}

module.exports = {
    askGroq
};
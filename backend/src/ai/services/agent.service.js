const { gemini, GEMINI_MODEL } = require("../config/gemini");
const { SYSTEM_PROMPT } = require("../prompts/systemPrompt");
const ToolExecutor = require("./toolExecutor.service");

class AgentService {

    async chat(message) {

        const prompt = `
${SYSTEM_PROMPT}

User:
${message}

Reply ONLY in JSON.

Example:

{
   "tool":"dashboard",
   "action":"summary",
   "parameters":{}
}

OR

{
   "tool":"none",
   "reply":"Normal response"
}
`;

        const response =
            await gemini.models.generateContent({

                model: GEMINI_MODEL,

                contents: prompt

            });

       let text = response.text.trim();

// Remove Markdown code blocks if Gemini returns them
text = text
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

console.log("Gemini Clean Response:");
console.log(text);

        console.log("Gemini Output:");
        console.log(text);

        try {

            const aiResponse = JSON.parse(text);

            if (aiResponse.tool && aiResponse.tool !== "none") {

                const result =
                    await ToolExecutor.execute(

                        aiResponse.tool,

                        aiResponse.parameters || {}

                    );

                return {

                    ai: aiResponse,

                    toolResult: result

                };

            }

            return {

                ai: aiResponse

            };

        }

        catch {

            return {

                ai: {

                    reply: text

                }

            };

        }

    }

}

module.exports = new AgentService();
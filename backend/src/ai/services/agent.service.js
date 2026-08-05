const { groq, GROQ_MODEL } = require("../config/groq");
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

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    let text = completion.choices[0].message.content.trim();

    console.log("Groq Response:");
    console.log(text);

    try {
      const aiResponse = JSON.parse(text);

      if (aiResponse.tool && aiResponse.tool !== "none") {
        const result = await ToolExecutor.execute(
          aiResponse.tool,
          aiResponse.parameters || {}
        );

        return {
          ai: aiResponse,
          toolResult: result,
        };
      }

      return {
        ai: aiResponse,
      };
    } catch (err) {
      console.error(err);

      return {
        ai: {
          tool: "none",
          reply: text,
        },
      };
    }
  }
}

module.exports = new AgentService();
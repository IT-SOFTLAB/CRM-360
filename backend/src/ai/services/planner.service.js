const { groq, GROQ_MODEL } = require("../config/groq");
const { PLANNER_PROMPT } = require("../prompts/plannerPrompt");

class PlannerService {

    async createPlan(userMessage) {

        try {

            const completion = await groq.chat.completions.create({

                model: GROQ_MODEL,

                temperature: 0,

                response_format: {
                    type: "json_object"
                },

                messages: [

                    {
                        role: "system",
                        content: PLANNER_PROMPT
                    },

                    {
                        role: "user",
                        content: userMessage
                    }

                ]

            });

            let plan =
                completion.choices[0].message.content.trim();

            console.log("\n========== RAW PLAN ==========\n");

            console.log(plan);

            plan = plan
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const parsed = JSON.parse(plan);

            //-----------------------------------------
            // Backward Compatibility
            //-----------------------------------------

            if (!parsed.steps) {

                return {

                    steps: [

                        {

                            tool: parsed.tool,

                            action: parsed.action,

                            parameters: parsed.parameters || {}

                        }

                    ]

                };

            }

            return parsed;

        }

        catch (err) {

            console.error("Planner Error:", err);

            return {

                steps: [],

                error: err.message

            };

        }

    }

}

module.exports = new PlannerService();
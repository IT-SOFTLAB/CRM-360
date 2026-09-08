const { groq, GROQ_MODEL } = require("../config/groq");
const { PLANNER_PROMPT } = require("../prompts/plannerPrompt");

class PlannerService {

validatePlan(plan) {

    if (!plan || !Array.isArray(plan.steps)) {
        return {
            valid: false,
            message: "Invalid AI execution plan."
        };
    }

    for (const step of plan.steps) {

        if (
            !step ||
            typeof step.tool !== "string" ||
            typeof step.action !== "string"
        ) {
            return {
                valid: false,
                message: "Invalid tool or action."
            };
        }

        const allowedActions =
            ALLOWED_ACTIONS[step.tool];

        if (!allowedActions) {
            return {
                valid: false,
                message:
                    `Tool '${step.tool}' is not allowed.`
            };
        }

        if (
            !allowedActions.includes(
                step.action
            )
        ) {
            return {
                valid: false,
                message:
                    `Action '${step.action}' is not allowed for tool '${step.tool}'.`
            };
        }

        if (
            step.parameters !== undefined &&
            (
                typeof step.parameters !== "object" ||
                step.parameters === null ||
                Array.isArray(step.parameters)
            )
        ) {
            return {
                valid: false,
                message:
                    "Step parameters must be an object."
            };
        }
    }

    return {
        valid: true
    };
}


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
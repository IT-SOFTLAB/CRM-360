const PlannerService = require("./planner.service");
const ToolExecutor = require("./toolExecutor.service");
const ConfirmationService = require("./confirmation.service");
const WorkflowService = require("./workflow.service");

class AgentService {


    getGeneralResponse(message) {

        const text = message.trim().toLowerCase();

        // Greetings
        if (/^(hi+|hello+|hey+|hii+|good morning|good afternoon|good evening)[!. ]*$/.test(text)) {
            return "Hello! 👋 Welcome to CRM-360. How can I help you today?";
        }

        // How are you?
        if (/^(how are you|how r u|how are you doing)[?.! ]*$/.test(text)) {
            return "I'm doing great! 😊 I'm here to help you manage your CRM activities. What would you like to do today?";
        }

        // Thanks
        if (/^(thanks|thank you|thankyou|thx)[!. ]*$/.test(text)) {
            return "You're welcome! 😊 Let me know if you need any more help.";
        }

        // Capabilities
        if (
            text.includes("what can you do") ||
            text.includes("your capabilities") ||
            text.includes("help me")
        ) {
            return `I'm your CRM-360 AI Agent! 🤖

I can help you with:

• Lead management and tracking
• Team performance reports
• Sales analytics and forecasting
• Referral management
• Franchise information
• CRM activities and tasks
• Business reports

Just tell me what you want to know!`;
        }

        return null;
    }


    async chat(message, req = null) {

        //-----------------------------------
        // Safety check
        //-----------------------------------

        if (!message || !message.trim()) {
            return {
                success: false,
                message: "Message is required."
            };
        }

        //-----------------------------------
// Handle general conversation
//-----------------------------------



        //-----------------------------------
        // Handle confirmation
        //-----------------------------------

        if (message.trim().toUpperCase() === "YES") {

            const userKey = req?.user?.id || "anonymous";

            const pending =
                ConfirmationService.get(userKey);

            if (!pending) {
                return {
                    success: false,
                    message: "No pending action."
                };
            }

            const result =
                await ToolExecutor.execute(
                    pending,
                    req
                );

            ConfirmationService.clear(userKey);

            WorkflowService.clear();

            return {
                success: true,
                confirmed: true,
                result
            };
        }

        //-----------------------------------
        // Step 1: Create AI plan
        //-----------------------------------

        const plan =
            await PlannerService.createPlan(message);

        console.log("\n========== AI PLAN ==========\n");
        console.log(plan);

        //-----------------------------------
        // Check planner error
        //-----------------------------------

        if (plan.error) {
            return {
                success: false,
                message: plan.error
            };
        }


        //-----------------------------------
        // Handle general conversation
        //-----------------------------------

        if (!plan.steps || plan.steps.length === 0) {

            const reply =
                await PlannerService.createConversationResponse(
                    message
                );

            return {
                success: true,
                type: "conversation",
                reply
            };
        }


        //-----------------------------------
        // Dangerous actions
        //-----------------------------------

        const dangerousActions = [
            "delete",
            "bulkDelete",
            "remove"
        ];

        //-----------------------------------
        // Check ALL workflow steps
        //-----------------------------------

        const hasDangerousAction =
            plan.steps?.some(step =>
                dangerousActions.includes(step.action)
            );

        //-----------------------------------
        // Ask confirmation BEFORE execution
        //-----------------------------------

        if (hasDangerousAction) {

            const userKey =
                req?.user?.id || "anonymous";

            ConfirmationService.create(
                userKey,
                plan
            );

            return {
                success: true,
                confirmation: true,
                message:
                    "⚠ This action requires confirmation.\n\nType YES to continue."
            };
        }

        //-----------------------------------
        // Step 2: Execute safe workflow
        //-----------------------------------

        const result =
            await ToolExecutor.execute(
                plan,
                req
            );

        //-----------------------------------
        // Clear workflow state
        //-----------------------------------

        WorkflowService.clear();

        //-----------------------------------
        // Step 3: Return result
        //-----------------------------------

        return {
            success: true,
            workflow: plan.steps?.length || 0,
            steps: plan.steps || [],
            results: result
        };
    }
}

module.exports = new AgentService();
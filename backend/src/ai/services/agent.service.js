const PlannerService = require("./planner.service");
const ToolExecutor = require("./toolExecutor.service");
const ConfirmationService = require("./confirmation.service");
const WorkflowService = require("./workflow.service");

class AgentService {

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
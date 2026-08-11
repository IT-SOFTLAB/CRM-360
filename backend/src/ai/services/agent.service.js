const PlannerService = require("./planner.service");
const ToolExecutor = require("./toolExecutor.service");
const ConfirmationService =
require("./confirmation.service");
class AgentService {

    
 async chat(message, req = null) {

        //-----------------------------------
// Confirmation Check
//-----------------------------------

if (

message.trim().toUpperCase()==="YES"

){

const userKey = req?.user?.id || 'anonymous';
const pending = ConfirmationService.get(userKey);

if(!pending){

return{

success:false,

message:"No pending action."

};

}

const result =
await ToolExecutor.execute(
    pending,
    req
);

ConfirmationService.clear(userKey);

return{

success:true,

confirmed:true,

result

};

}
        // Step 1: Convert user message into a plan
        const plan = await PlannerService.createPlan(message);

        console.log("\n========== AI PLAN ==========\n");
        console.log(plan);

        if (plan.error) {
            return {
                success: false,
                message: plan.error,
            };
        }

        // Step 2: Execute the plan
       const result = await ToolExecutor.execute(
    plan,
    req
);

const WorkflowService =
require("./workflow.service");

WorkflowService.clear();
        //-----------------------------------
// Dangerous Actions
//-----------------------------------

const dangerousActions = [

    "delete",

    "bulkDelete",

    "remove"

   

];

if (

    dangerousActions.includes(

        plan.action

    )

){

    const userKey = req?.user?.id || 'anonymous';

ConfirmationService.create(userKey, plan);

    return {

        success:true,

        confirmation:true,

        message:

`⚠ This action requires confirmation.

Type YES to continue.`

    };

}


        // Step 3: Return both plan and execution result
      return {

    success: true,

    workflow: plan.steps.length,

    steps: plan.steps,

    results: result

};
    }

}

module.exports = new AgentService();
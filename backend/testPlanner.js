const PlannerService = require("./src/ai/services/planner.service");

(async () => {

    const plan = await PlannerService.createPlan(

        "Show my dashboard"

    );

    console.log(JSON.stringify(plan, null, 4));

})();
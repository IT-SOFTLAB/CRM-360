const PlannerService = require("./src/ai/services/planner.service");

(async () => {

    const plan = await PlannerService.createPlan(
        "Show my unread emails"
    );

    console.log("\n========== RAW PLAN ==========\n");

    console.log(JSON.stringify(plan, null, 4));

})();
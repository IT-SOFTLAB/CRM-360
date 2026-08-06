const PlannerService = require("./src/ai/services/planner.service");

async function run() {

    const plan =
        await PlannerService.createPlan(

            "Assign Healthcare Leads to Flashy"

        );

    console.log(JSON.stringify(plan, null, 4));

}

run();
const OpportunityActions = require("../actions/opportunity.actions");

module.exports = {

    name: "pipeline",

    async execute(step, req) {

        switch (step.action) {

           case "moveStage":

                return await OpportunityActions.moveStage(
                    step.parameters,
                    req
                );

            default:

                return {

                    success: false,

                    message: `Unknown pipeline action '${step.action}'.`

                };

        }

    }

};
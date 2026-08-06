const OpportunityActions = require("../actions/opportunity.actions");

module.exports = {

    name: "pipeline",

    async execute(step) {

        switch (step.action) {

            case "moveStage":

                return await OpportunityActions.moveStage(
                    step.parameters
                );

            default:

                return {

                    success: false,

                    message: `Unknown pipeline action '${step.action}'.`

                };

        }

    }

};
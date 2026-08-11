const DashboardActions = require("../actions/dashboard.actions");

module.exports = {

    name: "dashboard",

    async execute(step, req) {

        switch (step.action) {

            case "summary":

                return await DashboardActions.summary(

                    step.parameters,

                    req

                );

            default:

                return {

                    success: false,

                    message: `Unknown dashboard action '${step.action}'.`

                };

        }

    }

};
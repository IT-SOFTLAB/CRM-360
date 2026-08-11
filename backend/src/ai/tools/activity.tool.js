const ActivityActions = require("../actions/activity.actions");

module.exports = {

    name: "activity",

    async execute(step, req) {

        switch (step.action) {

            //--------------------------------
            // Schedule Activity
            //--------------------------------

            case "schedule":

                return await ActivityActions.schedule(
                    step.parameters,
                    req
                );

            default:

                return {

                    success: false,

                    message: `Unknown activity action '${step.action}'.`

                };

        }

    }

};
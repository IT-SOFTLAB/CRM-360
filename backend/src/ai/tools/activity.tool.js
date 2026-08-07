const ActivityActions = require("../actions/activity.actions");

module.exports = {

    name: "activity",

    async execute(step) {

        switch (step.action) {

            //--------------------------------
            // Schedule Activity
            //--------------------------------

            case "schedule":

                return await ActivityActions.schedule(
                    step.parameters
                );

            default:

                return {

                    success: false,

                    message: `Unknown activity action '${step.action}'.`

                };

        }

    }

};
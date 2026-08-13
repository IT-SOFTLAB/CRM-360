const RetentionActions = require("../actions/retention.actions");

module.exports = {

    name: "retention",

    async execute(step, req) {

        switch (step.action) {

            case "createStage":

                return await RetentionActions.createStage(
                    step.parameters,
                    req
                );


            case "moveStage":

                return await RetentionActions.moveStage(
                    step.parameters,
                    req
                );


            case "submit":

                return await RetentionActions.submit(
                    step.parameters,
                    req
                );


            default:

                return {
                    success: false,
                    message:
                        `Unknown retention action '${step.action}'.`
                };

        }

    }

};
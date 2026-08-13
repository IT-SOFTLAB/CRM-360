const ClientActions = require("../actions/client.actions");

module.exports = {

    name: "client",

    async execute(step, req) {

        switch (step.action) {

            case "search":

                return await ClientActions.search(
                    step.parameters,
                    req
                );

            default:

                return {
                    success: false,
                    message:
                        `Unknown client action '${step.action}'.`
                };

        }

    }

};
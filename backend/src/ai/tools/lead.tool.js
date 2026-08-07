const LeadActions = require("../actions/lead.actions");

module.exports = {

    name: "lead",

    async execute(step, req) {

        switch (step.action) {

            case "create":
                return await LeadActions.create(
                    step.parameters,
                    req
                );

            case "search":
                return await LeadActions.search(
                    step.parameters,
                    req
                );

            case "bulkAssign":
                return await LeadActions.bulkAssign(
                    step.parameters,
                    req
                );

            case "update":
                return await LeadActions.update(
                    step.parameters,
                    req
                );

            default:
                return {
                    success: false,
                    message: `Unknown lead action '${step.action}'.`
                };

        }

    }

};
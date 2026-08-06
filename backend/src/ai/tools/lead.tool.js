const LeadActions = require("../actions/lead.actions");

module.exports = {

    name: "lead",

    async execute(step) {

        switch (step.action) {

            case "create":
                return await LeadActions.create(step.parameters);

            case "search":
                return await LeadActions.search(step.parameters);

            case "bulkAssign":
                return await LeadActions.bulkAssign(step.parameters);

            case "update":
                return await LeadActions.update(step.parameters);

            default:
                return {

                    success: false,

                    message: `Unknown lead action '${step.action}'.`

                };

        }

    }

};
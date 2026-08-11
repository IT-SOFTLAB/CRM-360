const ReportActions = require("../actions/report.actions");

module.exports = {

    name: "report",

    async execute(step, req) {

        switch (step.action) {

            case "generate":

                return await ReportActions.generate(

                    step.parameters,

                    req

                );

            default:

                return {

                    success: false,

                    message: `Unknown report action '${step.action}'.`

                };

        }

    }

};
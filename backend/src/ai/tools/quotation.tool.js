const QuotationActions = require("../actions/quotation.actions");

module.exports = {

    name: "quotation",

    async execute(step, req) {

        switch (step.action) {

            case "create":

                return await QuotationActions.create(

                    step.parameters,

                    req

                );

            default:

                return {

                    success: false,

                    message: `Unknown quotation action '${step.action}'.`

                };

        }

    }

};
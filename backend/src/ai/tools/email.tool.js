const EmailActions = require("../actions/email.actions");

module.exports = {

    name: "email",

    async execute(step, req) {

        switch (step.action) {

            //--------------------------------
            // Draft
            //--------------------------------

      case "draft":

    return await EmailActions.draft(
        step.parameters,
        req
    );

            //--------------------------------
            // Send
            //--------------------------------

            case "send":

                return await EmailActions.send(
                    step.parameters,
                    req
                );

                case "unread":

    return await EmailActions.unread(req);

            default:

                return {

                    success: false,

                    message: `Unknown email action '${step.action}'.`

                };

        }

    }

};
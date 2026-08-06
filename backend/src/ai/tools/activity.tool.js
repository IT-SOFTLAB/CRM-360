module.exports = {

    name: "activity",

    async execute(step) {

        return {

            success: true,

            message: `Activity action '${step.action}' executed.`,

            data: step.parameters

        };

    }

};
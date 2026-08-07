const AgentService = require("../services/agent.service");

const chat = async (req, res) => {

    try {

        const { message } = req.body;

       const result =
    await AgentService.chat(
        message,
        req
    );

        return res.json({

            success: true,

            result

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

module.exports = {

    chat

};
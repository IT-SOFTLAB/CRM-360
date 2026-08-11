
const { PrismaClient } = require("@prisma/client");
const PipelineService = require("../services/pipelineService");
const prisma = new PrismaClient();

module.exports = {

    async moveStage({ lead, stage }, req) {

    const updated = await PipelineService.moveStage(

        lead,

        stage,

        req.user

    );

    if (!updated) {

        return {

            success: false,

            message: "Opportunity not found or access denied."

        };

    }

    return {

        success: true,

        message: `${lead} moved to ${stage}.`,

        data: updated

    };

}

};
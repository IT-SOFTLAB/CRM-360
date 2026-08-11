const { PrismaClient } = require("@prisma/client");
const PipelineService = require("../services/pipelineService");

const prisma = new PrismaClient();

module.exports = {

    /**
     * Move a lead to the given pipeline stage.
     * PipelineService handles auto-creating the opportunity/stage.
     */
    async moveStage({ lead, stage }, req) {

        const result = await PipelineService.moveStage(lead, stage, req.user);

        if (!result) {
            return {
                success: false,
                message: `Lead "${lead}" not found. Please check the name and try again.`
            };
        }

        return {
            success: true,
            message: `"${lead}" has been moved to the ${result.stage} stage.`,
            data: result
        };
    }

};
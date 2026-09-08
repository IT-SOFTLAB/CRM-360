const PipelineService =
    require("../services/pipelineService");

module.exports = {

    /**
     * Move a lead to the given pipeline stage.
     * PipelineService handles auto-creating
     * the opportunity/stage.
     */
    async moveStage({ lead, stage }, req) {

        //----------------------------------
        // Organization validation
        //----------------------------------

        if (!req?.user?.organizationId) {

            return {

                success: false,

                message:
                    "Organization access is required."

            };

        }

        //----------------------------------
        // Move stage
        //----------------------------------

        const result =
            await PipelineService.moveStage(

                lead,

                stage,

                req.user

            );

        if (!result) {

            return {

                success: false,

                message:
                    `Lead "${lead}" not found or you do not have access.`

            };

        }

        return {

            success: true,

            message:
                `"${lead}" has been moved to the ${result.stage} stage.`,

            data: result

        };

    }

};
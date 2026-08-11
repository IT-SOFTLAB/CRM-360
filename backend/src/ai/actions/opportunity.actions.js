const { PrismaClient } = require("@prisma/client");

const PipelineService = require("../services/pipelineService");

const prisma = new PrismaClient();



module.exports = {

    async moveStage({ lead, stage }, req) {

    let opportunity = await PipelineService.moveStage(

        lead,

        stage,

        req.user

    );

    if (!opportunity) {

        return {

            success: false,

                message:"Opportunity not found."

            }

        }

    let updated = opportunity;

        // Authorization check
        if (req && req.user) {
            const AuthorizationService = require("../services/authorization.service");
            if (!AuthorizationService.isAdminLike(req.user)) {
                if (opportunity.leadId) {
                    const assocLead = await prisma.lead.findUnique({
                        where: { id: opportunity.leadId }
                    });
                    if (assocLead && assocLead.assignedUserId !== req.user.id) {
                        return {
                            success: false,
                            message: "Access denied. You do not own this opportunity's lead."
                        };
                    }
                } else if (opportunity.assignedSalespersonId !== req.user.id) {
                    return {
                        success: false,
                        message: "Access denied. You do not own this opportunity."
                    };
                }
            }
        }

        // Find or create the stage in PostgreSQL
        let matchedStage = await prisma.pipelineStage.findFirst({
            where: {
                name: {
                    equals: stage,
                    mode: "insensitive"
                }
            }
        });
        
        if (!matchedStage) {
            const stages = await prisma.pipelineStage.findMany();
            const maxOrder = stages.reduce((max, p) => p.order > max ? p.order : max, 0);
            const formattedName = stage.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            matchedStage = await prisma.pipelineStage.create({
                data: {
                    name: formattedName,
                    order: maxOrder + 1
                }
            });
        }

        const stageName = matchedStage.name;
        const stageId = matchedStage.id;

        updated = await prisma.opportunity.update({

            where:{

                id:opportunity.id

            },

            data:{

                stage: stageName,
                stageId: stageId

            }

        });

        if(updated.leadId){

            await prisma.lead.update({

                where:{

                    id:updated.leadId

                },

                data:{

                    status: stageName

                }

            });

        }



        return{

            success:true,

            message:`${lead} moved to ${stageName}.`,

        data: updated

    };

}

};
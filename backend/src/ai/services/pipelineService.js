const { PrismaClient } = require("@prisma/client");
const AuthorizationService = require("./authorization.service");

const prisma = new PrismaClient();

class PipelineService {

    async moveStage(lead, stage, user) {

        const where = {

            customerName: {

                equals: lead,

                mode: "insensitive"

            }

        };

        //------------------------------------
        // Authorization
        //------------------------------------

        Object.assign(
            where,
            AuthorizationService.opportunityFilter(user)
        );

        const opportunity = await prisma.opportunity.findFirst({

            where

        });

        if (!opportunity) {

            return null;

        }

        const updated = await prisma.opportunity.update({

            where: {

                id: opportunity.id

            },

            data: {

                stage

            }

        });

        //------------------------------------
        // Keep Lead status in sync
        //------------------------------------

        if (updated.leadId) {

            await prisma.lead.update({

                where: {

                    id: updated.leadId

                },

                data: {

                    status: stage

                }

            });

        }

        return updated;

    }

}

module.exports = new PipelineService();
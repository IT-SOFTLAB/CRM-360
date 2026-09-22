const { PrismaClient } = require("@prisma/client");
const { deletePatternCache } = require("../../config/redisCache");

const prisma = new PrismaClient();

const invalidateLeadCache = async (organizationId) => {
  if (!organizationId) return;
  await deletePatternCache(`crm:leads:${organizationId}:*`);
  await deletePatternCache(`crm:opportunities:${organizationId}:*`);
  await deletePatternCache(`crm:bootstrap:${organizationId}:*`);
  await deletePatternCache(`crm:dashboard:${organizationId}:*`);
};

module.exports = {

    async moveStage({ lead, stage }) {

        if (!lead || !stage) {

            return {
                success: false,
                message: "Lead name and stage are required."
            };

        }

        const existingLead = await prisma.lead.findFirst({

            where: {

                contactName: {

                    equals: lead,
                    mode: "insensitive"

                }

            }

        });

        if (!existingLead) {

            return {

                success: false,
                message: `Lead '${lead}' not found.`

            };

        }

        const updatedLead = await prisma.lead.update({

            where: {

                id: existingLead.id

            },

            data: {

                status: stage

            }

        });

        // Update opportunity stage as well
        await prisma.opportunity.updateMany({
            where: {
                leadId: existingLead.id,
                organizationId: existingLead.organizationId
            },
            data: {
                stage: stage
            }
        });

        await invalidateLeadCache(existingLead.organizationId);

        return {

            success: true,

            message: `${updatedLead.contactName} moved to '${stage}'.`,

            data: updatedLead

        };

    }

};
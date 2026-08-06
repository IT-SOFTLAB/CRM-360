const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

        return {

            success: true,

            message: `${updatedLead.contactName} moved to '${stage}'.`,

            data: updatedLead

        };

    }

};
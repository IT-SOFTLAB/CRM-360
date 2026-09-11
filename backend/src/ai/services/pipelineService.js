const { PrismaClient } = require("@prisma/client");
const AuthorizationService = require("./authorization.service");

const prisma = new PrismaClient();

class PipelineService {

    /**
     * Move a lead / opportunity to the given pipeline stage.
     */
    async moveStage(lead, stage, user) {

        if (!user || !user.organizationId) {
            throw new Error("Organization access is required.");
        }

        const organizationId = user.organizationId;

        // ----------------------------------------------------------
        // 1. Find existing opportunity
        // ----------------------------------------------------------

        const where = {
            customerName: {
                equals: lead,
                mode: "insensitive"
            },

            organizationId
        };

        Object.assign(
            where,
            AuthorizationService.opportunityFilter(user)
        );

        let finalOpportunity =
            await prisma.opportunity.findFirst({
                where
            });

        // ----------------------------------------------------------
        // 2. Resolve pipeline stage
        // ----------------------------------------------------------

        let matchedStage =
            await prisma.pipelineStage.findFirst({

                where: {
                    name: {
                        equals: stage,
                        mode: "insensitive"
                    },

                    organizationId
                }

            });

        // ----------------------------------------------------------
        // Create stage if it does not exist
        // ----------------------------------------------------------

        if (!matchedStage) {

 if (!AuthorizationService.isAdminLike(user)) {

        return null;

    }

            const allStages =
                await prisma.pipelineStage.findMany({

                    where: {
                        organizationId
                    }

                });

            const maxOrder =
                allStages.reduce(
                    (max, p) =>
                        p.order > max ? p.order : max,
                    0
                );

            const formattedName = stage
                .split(" ")
                .map(
                    word =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1)
                )
                .join(" ");

            matchedStage =
                await prisma.pipelineStage.create({

                    data: {
                        name: formattedName,
                        order: maxOrder + 1,
                        organizationId
                    }

                });

        }

        // ----------------------------------------------------------
        // 3. No opportunity found
        // Find the lead inside current organization
        // ----------------------------------------------------------

        if (!finalOpportunity) {

            const leadWhere = {

                contactName: {
                    equals: lead,
                    mode: "insensitive"
                },

                organizationId
            };

            // Apply user ownership restrictions
            Object.assign(
                leadWhere,
                AuthorizationService.leadFilter(user)
            );

            const leadRecord =
                await prisma.lead.findFirst({

                    where: leadWhere

                });

            if (!leadRecord) {
                return null;
            }

            // ------------------------------------------------------
            // Create opportunity inside same organization
            // ------------------------------------------------------

            finalOpportunity =
                await prisma.opportunity.create({

                    data: {

                        leadId:
                            leadRecord.id,

                        customerName:
                            leadRecord.contactName || lead,

                        company:
                            leadRecord.company || null,

                        email:
                            leadRecord.email || null,

                        phone:
                            leadRecord.phone || null,

                        dealValue:
                            leadRecord.dealValue || 0,

                        stage:
                            matchedStage.name,

                        stageId:
                            matchedStage.id,

                        assignedSalesperson:
                            leadRecord.assignedUser || null,

                        assignedSalespersonId:
                            leadRecord.assignedUserId || null,

                        organizationId

                    }

                });

            // ------------------------------------------------------
            // Sync lead status
            // ------------------------------------------------------

   await prisma.lead.updateMany({

    where: {

        id:
            leadRecord.id,

        organizationId,

        ...AuthorizationService.leadFilter(
            user
        )

    },

    data: {

        status:
            matchedStage.name

    }

});

            return finalOpportunity;
        }

        // ----------------------------------------------------------
        // 4. Update existing opportunity
        // ----------------------------------------------------------

        const updated =
            await prisma.opportunity.update({

                where: {
                    id: finalOpportunity.id
                },

                data: {

                    stage:
                        matchedStage.name,

                    stageId:
                        matchedStage.id

                }

            });

        // ----------------------------------------------------------
        // 5. Keep lead status in sync
        // ----------------------------------------------------------

      if (updated.leadId) {

    await prisma.lead.updateMany({

        where: {

            id:
                updated.leadId,

            organizationId,

            ...AuthorizationService.leadFilter(
                user
            )

        },

        data: {

            status:
                matchedStage.name

        }

    });

}

        // ----------------------------------------------------------
        // 6. Create customer when opportunity is Won
        // ----------------------------------------------------------

        if (
            matchedStage.name
                .trim()
                .toLowerCase() === "won"
        ) {

            const existingCustomer =
                await prisma.customer.findFirst({

                    where: {

                        opportunityId:
                            updated.id,

                        organizationId

                    }

                });

            if (!existingCustomer) {

                await prisma.customer.create({

                    data: {

                        opportunityId:
                            updated.id,

                        customerName:
                            updated.customerName,

                        company:
                            updated.company,

                        email:
                            updated.email,

                        phone:
                            updated.phone,

                        assignedSalesperson:
                            updated.assignedSalesperson,

                        assignedSalespersonId:
                            updated.assignedSalespersonId,

                        dealValue:
                            updated.dealValue || 0,

                        organizationId

                    }

                });

            }

        }

        return updated;

    }

}

module.exports = new PipelineService();
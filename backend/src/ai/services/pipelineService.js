const { PrismaClient } = require("@prisma/client");
const AuthorizationService = require("./authorization.service");

const prisma = new PrismaClient();

class PipelineService {

    /**
     * Move a lead / opportunity to the given pipeline stage.
     * If no opportunity record exists yet the service will:
     *   1. Look up the Lead by contactName or customerName.
     *   2. Auto-create the pipeline stage if it doesn't exist.
     *   3. Create an Opportunity linked to that Lead.
     * Then it updates the opportunity's stage and keeps the Lead status in sync.
     */
    async moveStage(lead, stage, user) {

        // ----------------------------------------------------------
        // 1. Try to find an existing opportunity (auth-filtered)
        // ----------------------------------------------------------
        const where = {
            customerName: {
                equals: lead,
                mode: "insensitive"
            }
        };

        Object.assign(where, AuthorizationService.opportunityFilter(user));

        let finalOpportunity = await prisma.opportunity.findFirst({ where });

        // ----------------------------------------------------------
        // 2. Resolve the pipeline stage (create if needed)
        // ----------------------------------------------------------
        let matchedStage = await prisma.pipelineStage.findFirst({
            where: {
                name: {
                    equals: stage,
                    mode: "insensitive"
                }
            }
        });

        if (!matchedStage) {
            const allStages = await prisma.pipelineStage.findMany();
            const maxOrder = allStages.reduce((max, p) => p.order > max ? p.order : max, 0);
            const formattedName = stage
                .split(" ")
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
            matchedStage = await prisma.pipelineStage.create({
                data: {
                    name: formattedName,
                    order: maxOrder + 1
                }
            });
        }

        // ----------------------------------------------------------
        // 3. If no opportunity exists, locate the lead and create one
        // ----------------------------------------------------------
        if (!finalOpportunity) {
            const leadRecord = await prisma.lead.findFirst({
                where: {
                    contactName: { equals: lead, mode: "insensitive" }
                }
            });

            if (!leadRecord) {
                // Neither lead nor opportunity found – cannot proceed
                return null;
            }

            finalOpportunity = await prisma.opportunity.create({
                data: {
                    leadId:                leadRecord.id,
                    customerName:          leadRecord.contactName || lead,
                    dealValue:             leadRecord.dealValue || 0,
                    stage:                 matchedStage.name,
                    stageId:               matchedStage.id,
                    assignedSalesperson:   leadRecord.assignedUser   || null,
                    assignedSalespersonId: leadRecord.assignedUserId || null
                }
            });

            // Sync lead status immediately after creating the opportunity
            await prisma.lead.update({
                where: { id: leadRecord.id },
                data: { status: matchedStage.name }
            });

            // Return early – opportunity is already at the right stage
            return finalOpportunity;
        }

        // ----------------------------------------------------------
        // 4. Update the existing opportunity's stage
        // ----------------------------------------------------------
        const updated = await prisma.opportunity.update({
            where: { id: finalOpportunity.id },
            data: {
                stage: matchedStage.name,
                stageId: matchedStage.id
            }
        });

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

//------------------------------------
// Create Customer when Won
//------------------------------------

if (stage.toLowerCase() === "won") {

    console.log(
        "Opportunity moved to Won. Checking customer..."
    );

    const existingCustomer =
        await prisma.customer.findFirst({

            where: {

                opportunityId: updated.id

            }

        });

    console.log(
        "Existing customer:",
        existingCustomer
    );

    if (!existingCustomer) {

    await prisma.customer.create({

        data: {

            opportunityId: updated.id,

            customerName: updated.customerName,

            company: updated.company,

            email: updated.email,

            phone: updated.phone,

            assignedSalesperson:
                updated.assignedSalesperson,

            assignedSalespersonId:
                updated.assignedSalespersonId,

            dealValue:
                updated.dealValue || 0

        }

    });

    console.log(
        "Customer created successfully:",
        updated.customerName
    );

}

}
    
return updated;

    }
}

module.exports = new PipelineService();
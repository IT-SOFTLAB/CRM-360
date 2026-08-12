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
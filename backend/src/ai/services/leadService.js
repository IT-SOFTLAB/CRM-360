const { PrismaClient } = require("@prisma/client");
const AuthorizationService = require("./authorization.service");
const prisma = new PrismaClient();

class LeadService {


    validateOrganization(user) {

    if (!user?.organizationId) {

        throw new Error(
            "Organization access is required."
        );

    }

}
    //----------------------------------------------------
    // Find User by Name
    //----------------------------------------------------

 async findUserByName(name, currentUser) {

    this.validateOrganization(currentUser);

    return await prisma.user.findFirst({

        where: {

            name: {
                equals: name,
                mode: "insensitive"
            },

            organizationId:
                currentUser.organizationId

        }

    });

}

    //----------------------------------------------------
    // Find Leads by Category
    //----------------------------------------------------

async findLeadsByCategory(category, user) {

    this.validateOrganization(user);

    const where = {

        category: {
            equals: category,
            mode: "insensitive"
        },

        ...AuthorizationService.leadFilter(
            user
        )

    };

    return await prisma.lead.findMany({

        where

    });

}
    //----------------------------------------------------
    // Bulk Assign
    //----------------------------------------------------

 //----------------------------------------------------
// Bulk Assign
//----------------------------------------------------

async bulkAssign(
    ids,
    assignedUser,
    assignedUserId,
    user
) {

    this.validateOrganization(user);

    //------------------------------------
    // Authorization
    //------------------------------------

    if (!AuthorizationService.canBulkAssign(user)) {

        throw new Error(
            "Access denied. Only Admin or Super Admin can bulk assign leads."
        );

    }

    //------------------------------------
    // Find only accessible leads
    //------------------------------------

    const leads =
        await prisma.lead.findMany({

            where: {

                id: {
                    in: ids
                },

                ...AuthorizationService.leadFilter(
                    user
                )

            },

            select: {
                id: true
            }

        });

    const authorizedIds =
        leads.map(
            lead => lead.id
        );

    if (authorizedIds.length === 0) {

        return {
            count: 0
        };

    }

    //------------------------------------
    // Update Leads
    //------------------------------------

    const updated =
        await prisma.lead.updateMany({

            where: {

                id: {
                    in: authorizedIds
                },

                ...AuthorizationService.leadFilter(
                    user
                )

            },

            data: {

                assignedUser,

                assignedUserId

            }

        });

    //------------------------------------
    // Update Opportunities
    //------------------------------------

    await prisma.opportunity.updateMany({

        where: {

            leadId: {
                in: authorizedIds
            },

            organizationId:
                user.organizationId

        },

        data: {

            assignedSalesperson:
                assignedUser,

            assignedSalespersonId:
                assignedUserId

        }

    });

    //------------------------------------
    // Find Opportunities
    //------------------------------------

    const opportunities =
        await prisma.opportunity.findMany({

            where: {

                leadId: {
                    in: authorizedIds
                },

                organizationId:
                    user.organizationId

            },

            select: {
                id: true
            }

        });

    const opportunityIds =
        opportunities.map(
            opportunity =>
                opportunity.id
        );

    //------------------------------------
    // Update Customers
    //------------------------------------

if (opportunityIds.length > 0) {

    await prisma.customer.updateMany({

        where: {

            opportunityId: {
                in: opportunityIds
            },

            organizationId:
                user.organizationId

        },

        data: {

            assignedSalesperson:
                assignedUser,

            assignedSalespersonId:
                assignedUserId

        }

    });

}

    return updated;

}

    //----------------------------------------------------
// Search Leads
//----------------------------------------------------

async searchLeads(filters = {}, user) {

    this.validateOrganization(user);

    const where = {

        ...AuthorizationService.leadFilter(
            user
        )

    };

    //------------------------------------
    // Category
    //------------------------------------

    if (filters.category) {

        where.category = {

            equals:
                filters.category,

            mode:
                "insensitive"

        };

    }

    //------------------------------------
    // Assigned User
    //------------------------------------

    if (filters.assignedUser) {

        where.assignedUser = {

            equals:
                filters.assignedUser,

            mode:
                "insensitive"

        };

    }

    //------------------------------------
    // Status
    //------------------------------------

    if (filters.status) {

        where.status = {

            equals:
                filters.status,

            mode:
                "insensitive"

        };

    }

    //------------------------------------
    // Contact Name
    //------------------------------------

    if (filters.contactName) {

        where.contactName = {

            equals:
                filters.contactName,

            mode:
                "insensitive"

        };

    }

    //------------------------------------
    // Query
    //------------------------------------

    return await prisma.lead.findMany({

        where,

        orderBy: {

            createdAt:
                "desc"

        }

    });

}

//----------------------------------------------------
// Create Lead
//----------------------------------------------------

async createLead(data) {

      if (!data?.organizationId) {

        throw new Error(
            "Organization access is required."
        );

    }

   return await prisma.lead.create({

    data: {

        contactName: data.contactName,

        company: data.company,

        email: data.email,

        phone: data.phone,

        category: data.category || "",

        serviceType: data.serviceType || "Service Based",

        assignedUser: data.assignedUser,

        assignedUserId: data.assignedUserId,

        status: "New",

      dealValue: data.dealValue || 0,

organizationId: data.organizationId

    }

});

}


//------------------------------------------------------
// UPDATE LEAD
//------------------------------------------------------

async updateLead(contactName, updateData, user) {

    this.validateOrganization(user);

  const lead = await prisma.lead.findFirst({

    where: {

        contactName: {
            equals: contactName,
            mode: "insensitive"
        },

        organizationId: user.organizationId

    }

});

    if (!lead) {

        return null;

    }

//------------------------------------
// Authorization
//------------------------------------


    const updatedLead = await prisma.lead.update({

        where: {

            id: lead.id

        },

        data: updateData

    });

    // Synchronize opportunity and customer tables
    const oppUpdateData = {};
    if (updateData.contactName !== undefined) oppUpdateData.customerName = updateData.contactName;
    if (updateData.company !== undefined) oppUpdateData.company = updateData.company;
    if (updateData.email !== undefined) oppUpdateData.email = updateData.email;
    if (updateData.phone !== undefined) oppUpdateData.phone = updateData.phone;
    if (updateData.dealValue !== undefined) {
      oppUpdateData.dealValue = updateData.dealValue ? Number(updateData.dealValue) : 0;
    }
    if (updateData.status !== undefined) oppUpdateData.stage = updateData.status;
    if (updateData.assignedUser !== undefined) oppUpdateData.assignedSalesperson = updateData.assignedUser;
    if (updateData.assignedUserId !== undefined) oppUpdateData.assignedSalespersonId = updateData.assignedUserId;

    if (Object.keys(oppUpdateData).length > 0) {
     await prisma.opportunity.updateMany({
  where: {
    leadId: lead.id,
    organizationId: user.organizationId
  },
  data: oppUpdateData
});
    }

    if (updateData.assignedUser !== undefined || updateData.assignedUserId !== undefined) {
 const opps = await prisma.opportunity.findMany({
  where: {
    leadId: lead.id,
    organizationId: user.organizationId
  },
  select: { id: true }
});
      const oppIds = opps.map(o => o.id);
      if (oppIds.length > 0) {
      await prisma.customer.updateMany({

    where: {

        opportunityId: {
            in: oppIds
        },

        organizationId:
            user.organizationId

    },

    data: {

        assignedSalesperson:
            updateData.assignedUser,

        assignedSalespersonId:
            updateData.assignedUserId

    }

});
      }
    }

    return updatedLead;

} 



}

module.exports = new LeadService();
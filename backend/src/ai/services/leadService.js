const { PrismaClient } = require("@prisma/client");
const AuthorizationService = require("./authorization.service");
const { deletePatternCache } = require("../../config/redisCache");
const prisma = new PrismaClient();

const invalidateLeadCache = async (organizationId) => {
  if (!organizationId) return;
  await deletePatternCache(`crm:leads:${organizationId}:*`);
  await deletePatternCache(`crm:opportunities:${organizationId}:*`);
  await deletePatternCache(`crm:bootstrap:${organizationId}:*`);
  await deletePatternCache(`crm:dashboard:${organizationId}:*`);
};

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

    await invalidateLeadCache(user.organizationId);
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
    throw new Error("Organization access is required.");
  }

  const lead = await prisma.lead.create({
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

  // Automatically create corresponding Opportunity in "New" stage for Pipeline view
  await prisma.opportunity.create({
    data: {
      organizationId: data.organizationId,
      leadId: lead.id,
      customerName: lead.contactName,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      dealValue: lead.dealValue || 0,
      stage: "New",
      assignedSalesperson: lead.assignedUser,
      assignedSalespersonId: lead.assignedUserId,
      createdAt: lead.createdAt
    }
  });

  await invalidateLeadCache(data.organizationId);

  return lead;
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
    if (updateData.assignedUser !== undefined || updateData.assignedUserId !== undefined) {
      oppUpdateData.assignedSalesperson = updatedLead.assignedUser;
      oppUpdateData.assignedSalespersonId = updatedLead.assignedUserId;
    }

    if (Object.keys(oppUpdateData).length > 0) {
      const oppRes = await prisma.opportunity.updateMany({
        where: {
          leadId: lead.id,
          organizationId: user.organizationId
        },
        data: oppUpdateData
      });

      if (oppRes.count === 0) {
        await prisma.opportunity.create({
          data: {
            organizationId: user.organizationId,
            leadId: lead.id,
            customerName: updatedLead.contactName,
            company: updatedLead.company,
            email: updatedLead.email,
            phone: updatedLead.phone,
            dealValue: updatedLead.dealValue || 0,
            stage: updatedLead.status || 'New',
            assignedSalesperson: updatedLead.assignedUser,
            assignedSalespersonId: updatedLead.assignedUserId,
            createdAt: updatedLead.createdAt
          }
        }).catch(err => console.error("leadService update missing opp create error:", err.message));
      }
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
            opportunityId: { in: oppIds },
            organizationId: user.organizationId
          },
          data: {
            assignedSalesperson: updatedLead.assignedUser,
            assignedSalespersonId: updatedLead.assignedUserId
          }
        });
      }
    }

    await invalidateLeadCache(user.organizationId);
    return updatedLead;

} 



}

module.exports = new LeadService();
const { PrismaClient } = require("@prisma/client");
const AuthorizationService = require("./authorization.service");
const prisma = new PrismaClient();

class LeadService {

    //----------------------------------------------------
    // Find User by Name
    //----------------------------------------------------

    async findUserByName(name) {

        return await prisma.user.findFirst({

            where: {

                name: {

                    equals: name,

                    mode: "insensitive"

                }

            }

        });

    }

    //----------------------------------------------------
    // Find Leads by Category
    //----------------------------------------------------

async findLeadsByCategory(category, user) {

    const where = {

        category: {

            equals: category,

            mode: "insensitive"

        }

    };

    //------------------------------------
    // Authorization
    //------------------------------------

    Object.assign(
        where,
        AuthorizationService.leadFilter(user)
    );

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

    //------------------------------------
    // Build Filter
    //------------------------------------

    const where = {

        id: {

            in: ids

        }

    };

    //------------------------------------
    // USER -> only own leads
    //------------------------------------

    if (!AuthorizationService.isAdmin(user)) {

        where.assignedUserId = user.id;

    }

    const updated =
        await prisma.lead.updateMany({

            where,

            data: {

                assignedUser,

                assignedUserId

            }

        });

    // Synchronize corresponding opportunities and customers
    await prisma.opportunity.updateMany({
      where: { leadId: { in: ids } },
      data: {
        assignedSalesperson: assignedUser,
        assignedSalespersonId: assignedUserId
      }
    });

    const opps = await prisma.opportunity.findMany({
      where: { leadId: { in: ids } },
      select: { id: true }
    });
    const oppIds = opps.map(o => o.id);
    if (oppIds.length > 0) {
      await prisma.customer.updateMany({
        where: { opportunityId: { in: oppIds } },
        data: {
          assignedSalesperson: assignedUser,
          assignedSalespersonId: assignedUserId
        }
      });
    }

    return updated;

}

    //----------------------------------------------------
// Search Leads
//----------------------------------------------------

async searchLeads(filters = {}, user) {

    const where = {};

    if (filters.category) {

        where.category = {

            equals: filters.category,

            mode: "insensitive"

        };

    }

    if (filters.assignedUser) {

        where.assignedUser = {

            equals: filters.assignedUser,

            mode: "insensitive"

        };

    }

    if (filters.status) {

        where.status = {

            equals: filters.status,

            mode: "insensitive"

        };

    }

//------------------------------------
// Authorization Filter
//------------------------------------

Object.assign(
    where,
    AuthorizationService.leadFilter(user)
);

    return await prisma.lead.findMany({

        where,

        orderBy: {

            createdAt: "desc"

        }

    });

} 

//----------------------------------------------------
// Create Lead
//----------------------------------------------------

async createLead(data) {

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

        dealValue: data.dealValue || 0

    }

});

}


//------------------------------------------------------
// UPDATE LEAD
//------------------------------------------------------

async updateLead(contactName, updateData, user) {

    const lead = await prisma.lead.findFirst({

        where: {

            contactName: {

                equals: contactName,

                mode: "insensitive"

            }

        }

    });

    if (!lead) {

        return null;

    }

//------------------------------------
// Authorization
//------------------------------------

if (!AuthorizationService.isAdmin(user)) {

    if (lead.assignedUserId !== user.id) {

        throw new Error(
            "Access denied. You do not own this lead."
        );

    }

}

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
        where: { leadId: lead.id },
        data: oppUpdateData
      });
    }

    if (updateData.assignedUser !== undefined || updateData.assignedUserId !== undefined) {
      const opps = await prisma.opportunity.findMany({
        where: { leadId: lead.id },
        select: { id: true }
      });
      const oppIds = opps.map(o => o.id);
      if (oppIds.length > 0) {
        await prisma.customer.updateMany({
          where: { opportunityId: { in: oppIds } },
          data: {
            assignedSalesperson: updateData.assignedUser,
            assignedSalespersonId: updateData.assignedUserId
          }
        });
      }
    }

    return updatedLead;

} 



}

module.exports = new LeadService();
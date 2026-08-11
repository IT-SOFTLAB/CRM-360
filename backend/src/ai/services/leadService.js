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

    async bulkAssign(ids, assignedUser, assignedUserId) {

        const updated =
            await prisma.lead.updateMany({

                where: {

                    id: {

                        in: ids

                    }

                },

                data: {

                    assignedUser,

                    assignedUserId

                }

            });

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

    return await prisma.lead.update({

        where: {

            id: lead.id

        },

        data: updateData

    });

} 



}

module.exports = new LeadService();
const LeadService = require("../services/leadService");

//-------------------------------------
// Bulk Assign
//-------------------------------------

async function bulkAssign(parameters, req) {

    const {

        category,

        assignee

    } = parameters;

//-------------------------------------
// Authorization
//-------------------------------------

const role = (req.user.role || "").toUpperCase();

if (role === "USER") {

    return {

        success: false,

        message: "Access denied. Only Admin or Super Admin can bulk assign leads."

    };

}

   const UserResolver =
require("../services/userResolver.service");

const user =
await UserResolver.resolve(
    assignee
);

    if (!user) {

        return {

            success: false,

            message: "User not found."

        };

    }

  const leads =
    await LeadService.findLeadsByCategory(

        category,

        req.user

    );

    if (leads.length === 0) {

        return {

            success: false,

            message: "No leads found."

        };

    }

    const ids =
        leads.map(
            lead => lead.id
        );

    await LeadService.bulkAssign(

        ids,

        user.name,

        user.id

    );

    return {

        success: true,

        message:
            `${ids.length} leads assigned to ${user.name}.`

    };

}

//-------------------------------------
// Placeholder Actions
//-------------------------------------
async function create(parameters, req) {
    const {

        contactName,

        company,

        email,

        phone,

        category,

        serviceType,

        assignee

    } = parameters;

const role = (req.user.role || "").toUpperCase();

if (
    role === "USER" &&
    assignee &&
    assignee.toLowerCase() !== req.user.name.toLowerCase()
) {

    return {

        success: false,

        message: "You can only assign leads to yourself."

    };

}

    const user =
        await LeadService.findUserByName(

            assignee

        );

    if (!user) {

        return {

            success: false,

            message: "Assigned user not found."

        };

    }

    const lead =
        await LeadService.createLead({

            contactName,

            company,

            email,

            phone,

            category,

            serviceType,

            assignedUser: user.name,

            assignedUserId: user.id

        });

    return {

        success: true,

        message: "Lead created successfully.",

        data: lead

    };

}

//------------------------------------------------------
// UPDATE LEAD
//------------------------------------------------------

async function update(parameters, req) {

    const {

        contactName,

        ...updateData

    } = parameters;

    if (!contactName) {

        return {

            success: false,

            message: "contactName is required."

        };

    }

   const updatedLead =
    await LeadService.updateLead(

        contactName,

        updateData,

        req.user

    );

    if (!updatedLead) {

        return {

            success: false,

            message: "Lead not found."

        };

    }

    return {

        success: true,

        message: "Lead updated successfully.",

        data: updatedLead

    };

}

async function remove() {

    return {

        success: false,

        message: "Delete Lead not implemented."

    };

}

async function search(parameters, req) {

    const leads = await LeadService.searchLeads(

        parameters,

        req.user

    );

    return {

        success: true,

        count: leads.length,

        data: leads,

        message: `${leads.length} lead(s) found.`

    };

}

module.exports = {

    bulkAssign,

    create,

    update,

    remove,

    search

};
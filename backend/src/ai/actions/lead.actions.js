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

  const role = (req.user.role || '').toUpperCase();

  //-------------------------------------
  // USER role -> always assign to self
  //-------------------------------------

  let finalUser = null;

  if (role === 'USER') {
    finalUser = req.user;
  } else {
    //-----------------------------------
    // ADMIN / SUPER_ADMIN
    //-----------------------------------

    if (assignee) {
      finalUser = await LeadService.findUserByName(assignee);
    }

    // fallback to logged-in admin
    if (!finalUser) {
      finalUser = req.user;
    }
  }

  if (!finalUser) {
    return {
      success: false,
      message: 'Assigned user not found.'
    };
  }

  const lead = await LeadService.createLead({
    contactName,
    company,
    email,
    phone,
    category,
    serviceType,
    assignedUser: finalUser.name,
    assignedUserId: finalUser.id
  });

  return {
    success: true,
    message: 'Lead created successfully.',
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

async function deleteLead(parameters, req) {
    const contactName = parameters.contactName || parameters.lead || parameters.leadName || parameters.name;
    if (!contactName) {
        return {
            success: false,
            message: "contactName is required to delete a lead."
        };
    }

    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const lead = await prisma.lead.findFirst({
        where: {
            contactName: {
                equals: contactName,
                mode: "insensitive"
            }
        }
    });

    if (!lead) {
        return {
            success: false,
            message: `Lead '${contactName}' not found.`
        };
    }

    // Authorization
    const AuthorizationService = require("../services/authorization.service");
    if (!AuthorizationService.isAdminLike(req.user)) {
        if (lead.assignedUserId !== req.user.id) {
            return {
                success: false,
                message: "Access denied. You do not own this lead."
            };
        }
    }

    // Delete associated opportunities first
    await prisma.opportunity.deleteMany({
        where: { leadId: lead.id }
    }).catch(err => console.log("Associated opportunities deletion failed:", err.message));

    await prisma.lead.delete({
        where: { id: lead.id }
    });

    // Also update db.json to keep them synced
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '../../../db.json');
    try {
        if (fs.existsSync(dbPath)) {
            const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            db.leads = db.leads.filter(l => l.id !== lead.id);
            db.opportunities = db.opportunities.filter(o => o.leadId !== lead.id);
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        }
    } catch (err) {
        console.error("Error syncing db.json on lead delete:", err);
    }

    return {
        success: true,
        message: `Lead '${contactName}' deleted successfully.`
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

    deleteLead,

    search

};
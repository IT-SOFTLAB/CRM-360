const LeadService =
    require("../services/leadService");

const UserResolverService =
    require("../services/userResolver.service");

const AuthorizationService =
    require("../services/authorization.service");

const { PrismaClient } =
    require("@prisma/client");

const prisma = new PrismaClient();

//-------------------------------------
// Bulk Assign
//-------------------------------------

async function bulkAssign(parameters, req) {

    const {

        category,

        assignee

    } = parameters;


if (!assignee) {

    return {

        success: false,

        message: "Assignee is required."

    };

}


//-------------------------------------
// Authorization
//-------------------------------------

//-------------------------------------
// Organization validation
//-------------------------------------

if (!req?.user?.organizationId) {

    return {

        success: false,

        message: "Organization access is required."

    };

}


//-------------------------------------
// Authorization
//-------------------------------------

if (!AuthorizationService.canBulkAssign(req.user)) {

    return {

        success: false,

        message:
            "Access denied. Only Admin or Super Admin can bulk assign leads."

    };

}


//-------------------------------------
// Resolve assignee
//-------------------------------------

const user =
    await UserResolverService.resolve(
        assignee,
        req.user
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

    user.id,

    req.user

);

    return {

        success: true,

        message:
            `${ids.length} leads assigned to ${user.name}.`

    };

}

//-------------------------------------
// Assign Single Lead
//-------------------------------------

async function assign(parameters, req) {

    const {
        lead,
        contactName,
        assignee
    } = parameters;

    const leadName = lead || contactName;

    if (!req?.user?.organizationId) {

    return {

        success: false,

        message: "Organization access is required."

    };

}

    if (!leadName) {

        return {

            success: false,

            message: "Lead name is required."

        };

    }

    if (!assignee) {

        return {

            success: false,

            message: "Assignee is required."

        };

    }

    //-------------------------------------
    // Authorization
    //-------------------------------------

   if (!AuthorizationService.canBulkAssign(req.user)) {

    return {

        success: false,

        message:
            "Access denied. Only Admin or Super Admin can assign leads."

    };

}

    //-------------------------------------
    // Find Assignee
    //-------------------------------------

    

   const user =
    await UserResolverService.resolve(
        assignee,
        req.user
    );

    if (!user) {

        return {

            success: false,

            message: `User '${assignee}' not found.`

        };

    }

    //-------------------------------------
    // Find Lead
    //-------------------------------------

    const prisma =
        new (require("@prisma/client").PrismaClient)();

   const existingLead =
    await prisma.lead.findFirst({

        where: {

            contactName: {

                equals: leadName,

                mode: "insensitive"

            },

            ...AuthorizationService.leadFilter(
                req.user
            )

        }

    });

    if (!existingLead) {

        return {

            success: false,

            message: `Lead '${leadName}' not found.`

        };

    }

    //-------------------------------------
    // Update Lead
    //-------------------------------------

    const updatedLead =
        await prisma.lead.update({

            where: {

                id: existingLead.id

            },

            data: {

                assignedUser: user.name,

                assignedUserId: user.id

            }

        });

    //-------------------------------------
    // Result
    //-------------------------------------

    return {

        success: true,

        message:
            `Lead '${updatedLead.contactName}' assigned to ${user.name}.`,

        data: updatedLead

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

 // const role = (req.user.role || '').toUpperCase();

  //-------------------------------------
  // USER role -> always assign to self
  //-------------------------------------

  let finalUser = null;

 if (!AuthorizationService.isAdminLike(req.user)) {

    // Normal USER always assigns the lead to themselves

    finalUser = req.user;

} else {
    //-----------------------------------
    // ADMIN / SUPER_ADMIN
    //-----------------------------------
    if (assignee) {
      // Handles: "me", "user", exact name lookup
      const token = (assignee === 'user') ? 'me' : assignee;
      finalUser = await UserResolverService.resolve(token, req.user);
    }

    // Fallback: if no assignee given or not found, assign to logged-in user
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
    assignedUserId: finalUser.id,

    organizationId: req.user.organizationId
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


    if (!req?.user?.organizationId) {

        return {
            success: false,
            message: "Organization access is required."
        };

    }

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

   

  const lead =
    await prisma.lead.findFirst({

        where: {

            contactName: {

                equals: contactName,

                mode: "insensitive"

            },

            ...AuthorizationService.leadFilter(
                req.user
            )

        }

    });

    if (!lead) {
        return {
            success: false,
      message:
    `Lead '${contactName}' not found or you do not have access.`
        };
    }

    // Authorization
   

    // Delete associated opportunities first
   await prisma.opportunity.deleteMany({

    where: {

        leadId: lead.id,

        organizationId:
            req.user.organizationId

    }

});
    await prisma.lead.delete({
        where: { id: lead.id }
    });



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

    assign,

    create,

    update,

    deleteLead,

    search

};
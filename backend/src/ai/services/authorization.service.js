class AuthorizationService {

    //------------------------------------
    // Is Admin?
    //------------------------------------

    isAdmin(user) {

        if (!user) return false;

        return (user.role || "").toUpperCase() === "ADMIN";

    }

    //------------------------------------
    // Can view all leads?
    //------------------------------------

    canViewAllLeads(user) {

        return this.isAdmin(user);

    }

    //------------------------------------
    // Can assign all leads?
    //------------------------------------

    canBulkAssign(user) {

        return this.isAdmin(user);

    }

    //------------------------------------
    // Build Prisma filter
    //------------------------------------

    leadFilter(user) {

        if (this.isAdmin(user)) {

            return {};

        }

        return {

            assignedUserId: user.id

        };

    }

//------------------------------------
// Opportunity Filter
//------------------------------------

opportunityFilter(user) {

    if (this.isAdmin(user)) {

        return {};

    }

    return {

        assignedSalespersonId: user.id

    };

}

//------------------------------------
// Customer Filter
//------------------------------------

customerFilter(user) {

    if (this.isAdmin(user)) {

        return {};

    }

    return {

        assignedSalespersonId: user.id

    };

}

}

module.exports = new AuthorizationService();
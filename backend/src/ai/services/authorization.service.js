class AuthorizationService {

  //------------------------------------
  // Is Super Admin?
  //------------------------------------

  isSuperAdmin(user) {
    if (!user) return false;

    return (user.role || "")
      .toUpperCase() === "SUPER_ADMIN";
  }

  //------------------------------------
  // Is Admin?
  //------------------------------------

  isAdmin(user) {
    if (!user) return false;

    return (user.role || "")
      .toUpperCase() === "ADMIN";
  }

  //------------------------------------
  // Admin-like roles
  //------------------------------------

  isAdminLike(user) {
    return this.isSuperAdmin(user) || this.isAdmin(user);
  }

  //------------------------------------
  // Organization Filter
  //------------------------------------

  organizationFilter(user) {

    if (!user || !user.organizationId) {
      return {
        id: "__NO_ORGANIZATION_ACCESS__"
      };
    }

    return {
      organizationId: user.organizationId
    };
  }

  //------------------------------------
  // Can view all leads?
  //------------------------------------

  canViewAllLeads(user) {
    return this.isAdminLike(user);
  }

  //------------------------------------
  // Can bulk assign?
  //------------------------------------

  canBulkAssign(user) {
    return this.isAdminLike(user);
  }

  //------------------------------------
  // Lead Filter
  //------------------------------------

  leadFilter(user) {

    const orgFilter = this.organizationFilter(user);

    // ADMIN / SUPER_ADMIN
    if (this.isAdminLike(user)) {
      return orgFilter;
    }

    // USER -> same organization + own records
    return {
      ...orgFilter,
      assignedUserId: user.id
    };
}

  //------------------------------------
  // Opportunity Filter
  //------------------------------------

  opportunityFilter(user) {

    const orgFilter = this.organizationFilter(user);

    // ADMIN / SUPER_ADMIN
    if (this.isAdminLike(user)) {
      return orgFilter;
    }

    // USER -> same organization + own records
    return {
      ...orgFilter,
      assignedSalespersonId: user.id
    };
  }

  //------------------------------------
  // Customer Filter
  //------------------------------------

  customerFilter(user) {

    const orgFilter = this.organizationFilter(user);

    if (this.isAdminLike(user)) {
      return orgFilter;
    }

    return {
      ...orgFilter,
      assignedSalespersonId: user.id
    };
}


  //------------------------------------
  // Activity Filter
  //------------------------------------

  activityFilter(user) {

    const orgFilter =
      this.organizationFilter(user);

    // ADMIN / SUPER_ADMIN
    if (this.isAdminLike(user)) {
      return orgFilter;
    }

    // USER -> same organization + own activities
    return {
      ...orgFilter,
      salesperson: user.name
    };

  }




  //------------------------------------
  // Referral Filter
  //------------------------------------

  referralFilter(user) {

    const orgFilter = this.organizationFilter(user);

    if (this.isAdminLike(user)) {
      return orgFilter;
    }

    return {
      ...orgFilter,
      OR: [
        {
          createdById: user.id
        },
        {
          createdBy: user.name
        }
      ]
    };
  }

  //------------------------------------
  // Check single lead access
  //------------------------------------

  canAccessLead(user, lead) {

    if (!user || !lead) return false;

    // Organization check FIRST
    if (
      lead.organizationId !== user.organizationId
    ) {
      return false;
    }

    // Admin can access all records
    // within their organization
    if (this.isAdminLike(user)) {
      return true;
    }

    return lead.assignedUserId === user.id;
  }

}

module.exports = new AuthorizationService();
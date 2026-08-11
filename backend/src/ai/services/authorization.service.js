class AuthorizationService {

  //------------------------------------
  // Is Super Admin?
  //------------------------------------

  isSuperAdmin(user) {
    if (!user) return false;
    return (user.role || '').toUpperCase() === 'SUPER_ADMIN';
  }

  //------------------------------------
  // Is Admin?
  //------------------------------------

  isAdmin(user) {
    if (!user) return false;
    return (user.role || '').toUpperCase() === 'ADMIN';
  }

  //------------------------------------
  // Admin-like roles
  //------------------------------------

  isAdminLike(user) {
    return this.isSuperAdmin(user) || this.isAdmin(user);
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
  // Build Prisma filter
  //------------------------------------

  leadFilter(user) {

    // ADMIN and SUPER_ADMIN -> all records
    if (this.isAdminLike(user)) {
      return {};
    }

    // USER -> own records only
    return {
      assignedUserId: user.id
    };
  }

  //------------------------------------
  // Build Prisma filter for opportunities
  //------------------------------------

  opportunityFilter(user) {

    // ADMIN and SUPER_ADMIN -> all records
    if (this.isAdminLike(user)) {
      return {};
    }

    // USER -> own records only
    return {
      assignedSalespersonId: user.id
    };
  }


  //------------------------------------
  // Check single lead access
  //------------------------------------

  canAccessLead(user, lead) {

    if (!user || !lead) return false;

    // ADMIN and SUPER_ADMIN -> access everything
    if (this.isAdminLike(user)) {
      return true;
    }

    // USER -> own lead only
    return lead.assignedUserId === user.id;
  }
}

module.exports = new AuthorizationService();
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User is not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}` });
    }

    next();
  };
};

const requireSuperAdmin = requireRole(['SUPER_ADMIN']);
const requireAdminOrSuperAdmin = requireRole(['SUPER_ADMIN', 'ADMIN']);

// Enforces Odoo-style record ownership rules for USER/Sales Executive role
const authorizeOwnership = (modelName, idParamName = 'id') => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Admins and Super Admins have bypass permission
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        return next();
      }

      const recordId = req.params[idParamName];
      if (!recordId) {
        return next(); // If no ID to check ownership of, let it pass
      }

      if (modelName === 'Lead') {
        const lead = await prisma.lead.findUnique({ where: { id: recordId } });
        if (lead && lead.assignedUserId !== user.id) {
          return res.status(403).json({ message: 'Access denied. You do not own this Lead.' });
        }
      } else if (modelName === 'Opportunity') {
        const opp = await prisma.opportunity.findUnique({ where: { id: recordId } });
        if (opp && opp.assignedSalespersonId !== user.id) {
          return res.status(403).json({ message: 'Access denied. You do not own this Opportunity.' });
        }
      } else if (modelName === 'Customer') {
        const customer = await prisma.customer.findUnique({ where: { id: recordId } });
        if (customer && customer.assignedSalespersonId !== user.id) {
          return res.status(403).json({ message: 'Access denied. You do not own this Customer.' });
        }
      } else if (modelName === 'Task') {
        const task = await prisma.task.findUnique({ where: { id: recordId } });
        if (task && task.assignedToId !== user.id && task.assignedById !== user.id) {
          return res.status(403).json({ message: 'Access denied. You are not assigned to this Task.' });
        }
      }

      next();
    } catch (err) {
      console.error(`Ownership check error on ${modelName}:`, err.message);
      return res.status(500).json({ message: 'Error checking record ownership' });
    }
  };
};

module.exports = {
  requireRole,
  requireSuperAdmin,
  requireAdminOrSuperAdmin,
  authorizeOwnership
};

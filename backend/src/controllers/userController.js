const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// Get all users (Admin / Super Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        admin: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Strip passwords
    const cleanUsers = users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });

    res.json(cleanUsers);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update user details (Super Admin only, except status/locking if Admin manages)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, isLocked, department, category, salesTeamId, adminId } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) {
      const existingName = await prisma.user.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: id }
        }
      });
      if (existingName) {
        return res.status(400).json({ message: 'User with this name already exists' });
      }
    }

    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: { equals: email.toLowerCase().trim(), mode: 'insensitive' },
          id: { not: id }
        }
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }

    // Role check: Admins cannot update other users to SUPER_ADMIN, and cannot update SUPER_ADMINs
    if (req.user.role === 'ADMIN' && (role === 'SUPER_ADMIN' || existing.role === 'SUPER_ADMIN')) {
      return res.status(403).json({ message: 'Admins cannot modify Super Admin details or assign Super Admin role' });
    }

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (role) dataToUpdate.role = role;
    if (status) dataToUpdate.status = status;
    if (isLocked !== undefined) dataToUpdate.isLocked = isLocked;
    if (department !== undefined) dataToUpdate.department = department;
    if (category !== undefined) dataToUpdate.category = category;
    if (salesTeamId !== undefined) dataToUpdate.salesTeamId = salesTeamId || null;
    if (adminId !== undefined) dataToUpdate.adminId = adminId || null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: {
        admin: {
          select: { id: true, name: true }
        }
      }
    });

    const { password, ...clean } = updatedUser;
    res.json(clean);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Reset user password (Super Admin or Admin for standard users)
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'ADMIN' && user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Admins cannot reset Super Admin passwords' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    // Invalidate refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: id } });

    res.json({ message: 'User password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete user (Super Admin only, cannot delete self or another Super Admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Super Admin accounts cannot be deleted' });
    }

    // Set salesTeamId to null on team assignments
    await prisma.salesTeam.updateMany({
      where: { leaderId: id },
      data: { leaderId: null }
    });

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: err.message });
  }
};

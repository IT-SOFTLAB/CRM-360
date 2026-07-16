const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new sales team (Admin / Super Admin only)
exports.createTeam = async (req, res) => {
  try {
    const { name, description, leaderId, memberIds, category } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    // Create the team
    const team = await prisma.salesTeam.create({
      data: {
        name,
        description,
        category,
        leaderId: leaderId || null
      }
    });

    // If memberIds are provided, associate them with this team
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: memberIds } },
        data: { salesTeamId: team.id }
      });
    }

    // Return full team details with leader and members
    const fullTeam = await prisma.salesTeam.findUnique({
      where: { id: team.id },
      include: {
        leader: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    res.status(201).json(fullTeam);
  } catch (err) {
    console.error('Create team error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all sales teams (Admin / Super Admin only)
exports.getTeams = async (req, res) => {
  try {
    const teams = await prisma.salesTeam.findMany({
      include: {
        leader: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true, role: true, department: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(teams);
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get a team by ID
exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await prisma.salesTeam.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true, role: true, department: true } }
      }
    });
    if (!team) {
      return res.status(404).json({ message: 'Sales team not found' });
    }
    res.json(team);
  } catch (err) {
    console.error('Get sales team error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update a sales team
exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, leaderId, memberIds, category, status } = req.body;

    const existingTeam = await prisma.salesTeam.findUnique({ where: { id } });
    if (!existingTeam) {
      return res.status(404).json({ message: 'Sales team not found' });
    }

    // Update basic team info
    const team = await prisma.salesTeam.update({
      where: { id },
      data: {
        name: name || existingTeam.name,
        description: description !== undefined ? description : existingTeam.description,
        category: category !== undefined ? category : existingTeam.category,
        leaderId: leaderId !== undefined ? leaderId : existingTeam.leaderId,
        status: status || existingTeam.status
      }
    });

    // Update members if memberIds provided
    if (memberIds && Array.isArray(memberIds)) {
      // 1. Remove all old members (set salesTeamId to null for users who were in this team)
      await prisma.user.updateMany({
        where: { salesTeamId: id },
        data: { salesTeamId: null }
      });

      // 2. Add new members
      if (memberIds.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: memberIds } },
          data: { salesTeamId: id }
        });
      }
    }

    const fullTeam = await prisma.salesTeam.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    res.json(fullTeam);
  } catch (err) {
    console.error('Update sales team error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a sales team
exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Reset salesTeamId for all member users
    await prisma.user.updateMany({
      where: { salesTeamId: id },
      data: { salesTeamId: null }
    });

    await prisma.salesTeam.delete({ where: { id } });
    res.json({ message: 'Sales team deleted successfully' });
  } catch (err) {
    console.error('Delete sales team error:', err);
    res.status(500).json({ message: err.message });
  }
};

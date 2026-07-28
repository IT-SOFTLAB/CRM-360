const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all saved filters for the logged-in user
exports.getSavedFilters = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = await prisma.savedFilter.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(filters);
  } catch (err) {
    console.error('Get saved filters error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Create a new saved filter
exports.createSavedFilter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, filters } = req.body;

    if (!name || !filters) {
      return res.status(400).json({ message: 'Name and filter payload are required' });
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        name,
        filters, // Stored as JSON
        userId
      }
    });

    res.status(201).json(savedFilter);
  } catch (err) {
    console.error('Create saved filter error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a saved filter
exports.deleteSavedFilter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await prisma.savedFilter.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Saved filter not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this filter' });
    }

    await prisma.savedFilter.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Saved filter deleted successfully' });
  } catch (err) {
    console.error('Delete saved filter error:', err);
    res.status(500).json({ message: err.message });
  }
};

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a task (Admin / Super Admin only)
exports.createTask = async (req, res) => {
  try {
    const { title, leadId, assignedToId, priority, deadline, remarks } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        leadId: leadId || null,
        assignedToId: assignedToId || null,
        assignedById: req.user.id,
        priority: priority || 'Normal',
        deadline: deadline ? new Date(deadline) : null,
        remarks: remarks || ''
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get tasks list (Role & Ownership based)
exports.getTasks = async (req, res) => {
  try {
    const user = req.user;
    let whereClause = {};

    // Enforce ownership: Sales Executives only see tasks assigned to them
    if (user.role === 'USER') {
      whereClause = { assignedToId: user.id };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get specific task by ID with comments
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    console.error('Get task by ID error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update task status and fields
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status, priority, deadline, remarks, assignedToId } = req.body;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Role verification: Sales Executive can only change status/remarks on assigned tasks
    if (req.user.role === 'USER' && existingTask.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only update tasks assigned to you.' });
    }

    const updatedData = {};
    if (status) updatedData.status = status;
    if (remarks !== undefined) updatedData.remarks = remarks;
    
    // Only Admin or Super Admin can change assignment/priority/deadline/title
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      if (title) updatedData.title = title;
      if (priority) updatedData.priority = priority;
      if (deadline !== undefined) updatedData.deadline = deadline ? new Date(deadline) : null;
      if (assignedToId !== undefined) updatedData.assignedToId = assignedToId;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updatedData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(task);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a task (Admin / Super Admin only)
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Add comment to task
exports.addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Comment content required' });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Role verification: Sales Executive can only comment on assigned tasks
    if (req.user.role === 'USER' && task.assignedToId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only comment on tasks assigned to you.' });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: req.user.id,
        userName: req.user.name,
        content
      }
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error('Add task comment error:', err);
    res.status(500).json({ message: err.message });
  }
};

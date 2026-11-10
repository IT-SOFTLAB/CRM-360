
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const checkAndCreateActivityReminders = async (
  userId,
  userName,
  organizationId
) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const tomorrowStart = new Date(
      tomorrowStr + "T00:00:00.000Z"
    );

    const tomorrowEnd = new Date(
      tomorrowStr + "T23:59:59.999Z"
    );

    const upcomingActivities = await prisma.activity.findMany({
      where: {
        salesperson: userName,
        done: false,
        organizationId,
        date: {
          gte: tomorrowStart,
          lte: tomorrowEnd
        }
      }
    });

    for (const act of upcomingActivities) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          title: "Activity Reminder",
          message: {
            contains: `"${act.title}"`
          }
        }
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId,
            title: "Activity Reminder",
            message: `Reminder: Activity "${act.title}" is scheduled for tomorrow.`,
            read: false
          }
        });
      }
    }
  } catch (err) {
    console.error(
      "Error in checkAndCreateActivityReminders:",
      err
    );
  }
};

// ==========================================
// GET NOTIFICATIONS
// ==========================================

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.name;

    await checkAndCreateActivityReminders(
      userId,
      userName,
      req.organizationId
    );

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        user: {
          organizationId: req.organizationId
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(notifications);

  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// MARK ONE AS READ
// ==========================================

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        id,
        userId,
        user: {
          organizationId: req.organizationId
        }
      },
      data: {
        read: true
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// MARK ALL AS READ
// ==========================================

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        user: {
          organizationId: req.organizationId
        }
      },
      data: {
        read: true
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// DELETE NOTIFICATION
// ==========================================

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.notification.deleteMany({
      where: {
        id,
        userId,
        user: {
          organizationId: req.organizationId
        }
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: err.message });
  }
};

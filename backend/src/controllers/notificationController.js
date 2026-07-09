const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', '..', 'db.json');

const checkAndCreateActivityReminders = async (userId, userName) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const tomorrowStart = new Date(tomorrowStr + "T00:00:00.000Z");
    const tomorrowEnd = new Date(tomorrowStr + "T23:59:59.999Z");

    // Find all undone activities for this user scheduled for tomorrow
    const upcomingActivities = await prisma.activity.findMany({
      where: {
        salesperson: userName,
        done: false,
        date: {
          gte: tomorrowStart,
          lte: tomorrowEnd
        }
      }
    });

    for (const act of upcomingActivities) {
      // Check if a reminder for this activity is already created
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
    console.error("Error in checkAndCreateActivityReminders:", err);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.name;

    // Trigger activity reminders generation
    await checkAndCreateActivityReminders(userId, userName);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.notification.deleteMany({
      where: { id, userId }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: err.message });
  }
};


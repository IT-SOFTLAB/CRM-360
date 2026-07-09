const { getGraphClient } = require("../services/graphService");
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const DB_FILE = path.join(__dirname, '..', '..', 'db.json');

exports.getInbox = async (req, res) => {
  if (!global.accessToken) {
    // Fallback to simulated local emails from db.json
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const db = JSON.parse(data);
        return res.json(db.emails || []);
      }
      return res.json([]);
    } catch (err) {
      console.error("Error reading db.json in email controller:", err);
      return res.json([]);
    }
  }

  try {
    const client = getGraphClient(global.accessToken);
    const mails = await client
      .api("/me/messages")
      .top(30)
      .orderby("receivedDateTime DESC")
      .get();
    res.json(mails.value);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.sendMail = async (req, res) => {
  const userId = req.user?.id;
  const userEmail = req.user?.email || 'superadmin@crm.com';

  try {
    let sentToday = 0;
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const db = JSON.parse(data);
      db.emails = db.emails || [];
      const todayStr = new Date().toISOString().split('T')[0];
      sentToday = db.emails.filter(e => e.sender === userEmail && e.date.startsWith(todayStr)).length;
    }

    if (sentToday >= 200) {
      if (userId) {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId,
            title: "Email Limit Exceeded",
            createdAt: { gte: todayStart }
          }
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId,
              title: "Email Limit Exceeded",
              message: "you have reached the daily limit for sending 200 emails",
              read: false
            }
          });
        }
      }

      return res.status(429).json({
        message: "you have reached the daily limit for sending 200 emails"
      });
    }
  } catch (err) {
    console.error("Error checking email limit:", err);
  }

  if (!global.accessToken) {
    // Simulate sending email by saving it in db.json
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const db = JSON.parse(data);
        const email = {
          id: 'e_' + Date.now(),
          date: new Date().toISOString(),
          read: true,
          replied: false,
          bounced: false,
          threadId: req.body.threadId || 'th_' + Date.now(),
          history: req.body.history || [],
          sender: req.user?.email || 'superadmin@crm.com',
          recipient: req.body.to,
          subject: req.body.subject,
          body: req.body.body,
          folder: 'Sent'
        };
        db.emails = db.emails || [];
        db.emails.unshift(email);
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        return res.json({ success: true, email });
      }
      return res.json({ success: true });
    } catch (err) {
      console.error("Error writing db.json in email controller:", err);
      return res.status(500).json({ message: "Failed to save email" });
    }
  }

  try {
    const client = getGraphClient(global.accessToken);
    await client.api("/me/sendMail").post({
      message: {
        subject: req.body.subject,
        body: {
          contentType: "HTML",
          content: req.body.body
        },
        toRecipients: [
          {
            emailAddress: {
              address: req.body.to
            }
          }
        ]
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
};
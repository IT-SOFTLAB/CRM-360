const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { getGraphClient } = require("../services/graphService");

const DB_FILE = path.join(__dirname, '..', '..', 'db.json');

const readDB = () => {
  if (!fs.existsSync(DB_FILE)) return {};
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file in bootstrap:", err);
    return {};
  }
};

const checkAndCreateActivityReminders = async (userId, userName) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const tomorrowStart = new Date(tomorrowStr + "T00:00:00.000Z");
    const tomorrowEnd = new Date(tomorrowStr + "T23:59:59.999Z");

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

exports.getBootstrapData = async (req, res) => {
  try {
    const user = req.user;
    const userRole = (user.role || '').toUpperCase().replace(/[\s_]+/g, '_');
    
    // Prepare DB files for mock data
    const db = readDB();

    // Trigger activity reminders generation
    await checkAndCreateActivityReminders(user.id, user.name);

    // 1. Where clauses based on role
    let leadWhere = {};
    let oppWhere = {};
    let customerWhere = {};
    let activityWhere = {};
    let quoteWhere = {};
    let referralWhere = {};
    let rewardWhere = {};

    if (userRole === 'USER') {
      leadWhere = {
        OR: [
          { assignedUserId: user.id },
          { assignedUser: user.name }
        ]
      };
      oppWhere = {
        OR: [
          { assignedSalespersonId: user.id },
          { assignedSalesperson: user.name }
        ]
      };
      customerWhere = { assignedSalesperson: user.name };
      activityWhere = { salesperson: user.name };
      quoteWhere = { salesperson: user.name };
      referralWhere = {
        OR: [
          { createdById: user.id },
          { createdBy: user.name }
        ]
      };
      rewardWhere = {
        referral: {
          OR: [
            { createdById: user.id },
            { createdBy: user.name }
          ]
        }
      };
    }

    // 2. Fetch everything concurrently
    const [
      leads,
      opportunities,
      customers,
      activities,
      quotations,
      referrals,
      totalReferralsCount,
      qualifiedLeadsCount,
      conversionsCount,
      paidRewardsAgg,
      pendingRewardsAgg,
      referralPipelineStages,
      dbUsers,
      notifications
    ] = await Promise.all([
      // leads
      prisma.lead.findMany({
        where: leadWhere,
        orderBy: { createdAt: "desc" }
      }),
      // opportunities
      prisma.opportunity.findMany({
        where: oppWhere,
        orderBy: { createdAt: "desc" }
      }),
      // customers
      prisma.customer.findMany({
        where: customerWhere,
        orderBy: { createdAt: "desc" }
      }),
      // activities
      prisma.activity.findMany({
        where: activityWhere,
        orderBy: { date: "asc" }
      }),
      // quotations
      prisma.quotation.findMany({
        where: quoteWhere,
        include: { items: true },
        orderBy: { createdAt: "desc" }
      }),
      // referrals
      prisma.referral.findMany({
        where: referralWhere,
        include: {
          currentStage: true,
          referralRewards: true,
          referralHistories: {
            include: { pipeline: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      // dashboard counts: total
      prisma.referral.count({ where: referralWhere }),
      // qualified
      prisma.referral.count({
        where: {
          ...referralWhere,
          currentStage: { isFinal: false }
        }
      }),
      // conversions
      prisma.referral.count({
        where: {
          ...referralWhere,
          currentStage: { isFinal: true }
        }
      }),
      // paid rewards sum
      prisma.referralReward.aggregate({
        _sum: { amount: true },
        where: { ...rewardWhere, paid: true }
      }),
      // pending rewards sum
      prisma.referralReward.aggregate({
        _sum: { amount: true },
        where: { ...rewardWhere, paid: false }
      }),
      // referral pipeline stages from Prisma
      prisma.referralPipeline.findMany({
        orderBy: { sequence: "asc" },
        include: {
          _count: { select: { referrals: true } }
        }
      }),
      (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN')
        ? prisma.user.findMany({
            include: {
              salesTeam: { select: { id: true, name: true } },
              admin: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
          })
        : Promise.resolve(null),
      // notifications
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      })
    ]);

    // 3. Handle dashboard values
    const referralDashboard = {
      totalReferrals: totalReferralsCount,
      qualifiedLeads: qualifiedLeadsCount,
      conversions: conversionsCount,
      totalRewardsPaid: paidRewardsAgg._sum.amount || 0,
      pendingRewardAmount: pendingRewardsAgg._sum.amount || 0
    };

    // 4. Handle dbUsers clean-up
    let settingsUsers = [];
    if (dbUsers) {
      settingsUsers = dbUsers.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
    }

    // 5. Fetch emails (Outlook or db.json fallback)
    let emails = [];
    if (global.accessToken) {
      try {
        const client = getGraphClient(global.accessToken);
        const mails = await client
          .api("/me/messages")
          .top(30)
          .orderby("receivedDateTime DESC")
          .get();
        emails = mails.value || [];
      } catch (err) {
        console.warn("Bootstrap: Outlook token error, falling back to mock emails", err);
        emails = db.emails || [];
      }
    } else {
      emails = db.emails || [];
    }

    // 6. Referral Pipeline default check (simulates pipelineController.getStages)
    let finalReferralStages = referralPipelineStages;
    if (finalReferralStages.length === 0) {
      // Create default stage if none exists
      await prisma.referralPipeline.create({
        data: {
          name: "New",
          sequence: 1,
          color: "#3B82F6",
          isFinal: false
        }
      });
      finalReferralStages = await prisma.referralPipeline.findMany({
        orderBy: { sequence: "asc" },
        include: {
          _count: { select: { referrals: true } }
        }
      });
    }

    // 7. Get static/mock data from db.json
    const categories = db.categories || [];
    const companyBranding = db.companyBranding || {
      name: 'Global CRM Cloud',
      primaryColor: '#2563EB',
      secondaryColor: '#0F172A',
      logoText: 'CRM 360'
    };
    const pipelines = (db.pipelines || []).sort((a, b) => a.order - b.order);
    const referralPipelines = (db.referralPipelines || []).sort((a, b) => a.order - b.order);

    // Return the bundled bootstrap data!
    res.json({
      leads,
      opportunities,
      customers,
      activities,
      quotations,
      referrals,
      referralDashboard,
      referralPipelineStages: finalReferralStages,
      pipelines,
      referralPipelines,
      emails,
      categories,
      companyBranding,
      settingsUsers,
      notifications
    });

  } catch (error) {
    console.error("Bootstrap error:", error);
    res.status(500).json({
      message: error.message || "Failed to load bootstrap data"
    });
  }
};

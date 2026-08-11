const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getGraphClient } = require("../services/graphService");
const { categories, companyBranding, mockEmails } = require("../config/staticData");

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
      notifications,
      companySettingsDb,
      pipelineStagesDb
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
      }),
      // company settings
      prisma.companySettings.findUnique({
        where: { id: 'global_settings' }
      }),
      // standard pipelines stages
      prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' }
      })
    ]);

    let finalOpportunities = opportunities;

    // 2.5. Synchronize old leads to pipeline if they don't have opportunities
    const allOppsWithLeadId = await prisma.opportunity.findMany({
      where: { leadId: { not: null } },
      select: { leadId: true }
    });
    const existingLeadIds = new Set(allOppsWithLeadId.map(o => o.leadId));
    const missingOpps = leads.filter(l => !existingLeadIds.has(l.id));
    if (missingOpps.length > 0) {
      console.log(`Syncing bootstrap: creating ${missingOpps.length} missing opportunities for existing leads`);
      await Promise.all(missingOpps.map(l => 
        prisma.opportunity.create({
          data: {
            leadId: l.id,
            customerName: l.contactName || l.name,
            company: l.company || '',
            email: l.email || '',
            phone: l.phone || '',
            dealValue: l.dealValue || 0,
            stage: l.status || 'New',
            assignedSalesperson: l.assignedUser || 'Unassigned',
            assignedSalespersonId: l.assignedUserId || null,
            createdAt: l.createdAt
          }
        }).catch(err => console.log("Failed to create sync opportunity:", err.message))
      ));

      finalOpportunities = await prisma.opportunity.findMany({
        where: oppWhere,
        orderBy: { createdAt: "desc" }
      });
    }

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

    // 5. Fetch emails (Outlook or static mock emails fallback)
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
        emails = mockEmails;
      }
    } else {
      emails = mockEmails;
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

    // 7. Get standard pipelines stages
    let pipelines = pipelineStagesDb;
    if (pipelines.length === 0) {
      const defaultStages = [
        { name: 'New', order: 1 },
        { name: 'Possible Response Received', order: 2 },
        { name: 'Discussion', order: 3 },
        { name: 'Proposal Preparation', order: 4 },
        { name: 'Negotiation', order: 5 },
        { name: 'Won', order: 6 },
        { name: 'Lost', order: 7 }
      ];
      await prisma.pipelineStage.createMany({
        data: defaultStages
      });
      pipelines = await prisma.pipelineStage.findMany({
        orderBy: { order: 'asc' }
      });
    }

    // 8. Map referralPipelines using database stages
    const referralPipelines = finalReferralStages.map(s => ({
      id: s.id,
      name: s.name,
      order: s.sequence
    }));

    // 9. Company Branding Settings
    const companyBrandingObj = companySettingsDb
      ? {
          name: companySettingsDb.companyName,
          logoText: companySettingsDb.logoText || 'CRM 360',
          primaryColor: companySettingsDb.primaryColor || '#2563EB',
          secondaryColor: companySettingsDb.secondaryColor || '#0F172A'
        }
      : companyBranding;

    // Return the bundled bootstrap data!
    res.json({
      leads,
      opportunities: finalOpportunities,
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
      companyBranding: companyBrandingObj,
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



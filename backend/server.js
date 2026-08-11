require("dotenv").config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require("express-session");
const fs = require('fs');
const path = require('path');


console.log(process.env.DATABASE_URL);
const app = express();
const PORT = process.env.PORT || 5000;
const { categories, companyBranding, mockEmails } = require("./src/config/staticData");
let activeCategories = [...categories];
let activeServices = ['Service Based', 'Product Based', 'Retainer Based', 'Consulting'];
const leadRoutes = require("./src/routes/leadRoutes.js");
const activityRoutes = require("./src/routes/activityRoutes.js");
const authRoutes=require("./src/routes/authRoutes.js");
console.log(require.resolve("./src/routes/authRoutes.js"));
const emailRoutes=require("./src/routes/emailRoutes.js");
const opportunityRoutes=require("./src/routes/opportunityRoutes.js");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const customerRoutes = require("./src/routes/customerRoutes.js");
const quotationRoutes = require("./src/routes/quotationRoutes");
const salesTeamRoutes = require("./src/routes/salesTeamRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const referralRoutes = require("./src/routes/referral.routes.js");
const pipelineRoutes = require("./src/routes/pipeline.routes.js");
const bootstrapRoutes = require("./src/routes/bootstrapRoutes.js");
const notificationRoutes = require("./src/routes/notificationRoutes.js");
const calendarRoutes = require("./src/routes/calenderRoutes.js");
const savedFilterRoutes = require("./src/routes/savedFilterRoutes.js");
const aiRoutes = require("./src/ai/routes/ai.routes");
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://crm-360-2.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isProduction) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});
app.use(cookieParser());
app.use(
    session({
        secret: process.env.SESSION_SECRET || "crm360-secret",
        resave: false,
        saveUninitialized: false,

        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        }
    })
);
app.use("/api/leads", leadRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/salesteam", salesTeamRoutes);
app.use("/api/users", userRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/emails",emailRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/referral-pipeline", pipelineRoutes);
app.use("/api/bootstrap", bootstrapRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/filters", savedFilterRoutes);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "src", "uploads"))
);
app.use("/api/ai", aiRoutes);
// Project Categories Management
app.get('/api/categories', (req, res) => {
  res.json(activeCategories);
});

app.post('/api/categories', async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ message: 'Category name required' });
  if (activeCategories.includes(category)) return res.status(400).json({ message: 'Category already exists' });
  activeCategories.push(category);
  await logActivity(null, null, 'CREATE_CATEGORY', 'Settings', `Created project category: ${category}`);
  res.json(activeCategories);
});

app.delete('/api/categories/:name', async (req, res) => {
  const { name } = req.params;
  const index = activeCategories.indexOf(name);
  if (index !== -1) {
    activeCategories.splice(index, 1);
    await logActivity(null, null, 'DELETE_CATEGORY', 'Settings', `Deleted project category: ${name}`);
    return res.json(activeCategories);
  }
  res.status(404).json({ message: 'Category not found' });
});

// Service Types Management
app.get('/api/services', (req, res) => {
  res.json(activeServices);
});

// Log actions (Audit log)
async function logActivity(db, user, action, module, details) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user ? user.id : null,
        userEmail: user ? user.email : 'System',
        action,
        module,
        details
      }
    });
  } catch (err) {
    console.error("Failed to log activity to PostgreSQL:", err);
  }
}



// Pipelines Config (Sales Stages CRUD)
app.get('/api/pipelines', async (req, res) => {
  try {
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(stages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/pipelines', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Pipeline stage name required' });
  try {
    const stages = await prisma.pipelineStage.findMany();
    const maxOrder = stages.reduce((max, p) => p.order > max ? p.order : max, 0);
    const newStage = await prisma.pipelineStage.create({
      data: {
        name,
        order: maxOrder + 1
      }
    });
    logActivity(null, null, 'CREATE_PIPELINE', 'Settings', `Created sales pipeline stage: ${name}`);
    res.status(201).json(newStage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/pipelines/:id', async (req, res) => {
  const { id } = req.params;
  const { name, order } = req.body;
  try {
    const updateData = {};
    if (name) updateData.name = name;
    if (order !== undefined) updateData.order = Number(order);

    const updatedStage = await prisma.pipelineStage.update({
      where: { id },
      data: updateData
    });
    logActivity(null, null, 'UPDATE_PIPELINE', 'Settings', `Updated pipeline stage ID: ${id}`);
    res.json(updatedStage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/pipelines/reorder', async (req, res) => {
  const { stages } = req.body; // Expect array of { id, order }
  if (!stages || !Array.isArray(stages)) return res.status(400).json({ message: 'Stages array required' });
  try {
    await prisma.$transaction(
      stages.map(st =>
        prisma.pipelineStage.update({
          where: { id: st.id },
          data: { order: Number(st.order) }
        })
      )
    );
    logActivity(null, null, 'REORDER_PIPELINE', 'Settings', `Reordered pipeline stages`);
    const allStages = await prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(allStages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/pipelines/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stage = await prisma.pipelineStage.findUnique({
      where: { id }
    });
    if (!stage) return res.status(404).json({ message: 'Pipeline stage not found' });

    await prisma.pipelineStage.delete({
      where: { id }
    });

    const allStages = await prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' }
    });

    // Re-link opportunities in this stage to the first stage if they exist
    const fallbackStage = allStages[0];
    const fallbackId = fallbackStage ? fallbackStage.id : '';
    const fallbackName = fallbackStage ? fallbackStage.name : 'New';

    await prisma.opportunity.updateMany({
      where: { stageId: id },
      data: {
        stageId: fallbackId,
        stage: fallbackName
      }
    });

    logActivity(null, null, 'DELETE_PIPELINE', 'Settings', `Deleted pipeline stage: ${stage.name}`);
    res.json({ message: 'Stage deleted', fallbackStageId: fallbackId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Referral Pipelines Config (CRUD)
app.get('/api/referral-pipelines', async (req, res) => {
  try {
    const stages = await prisma.referralPipeline.findMany({
      orderBy: { sequence: 'asc' }
    });
    res.json(stages.map(s => ({ id: s.id, name: s.name, order: s.sequence, color: s.color })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/referral-pipelines', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Referral stage name required' });
  try {
    const stages = await prisma.referralPipeline.findMany();
    const maxSequence = stages.reduce((max, p) => p.sequence > max ? p.sequence : max, 0);
    const newStage = await prisma.referralPipeline.create({
      data: {
        name,
        sequence: maxSequence + 1,
        color: '#3B82F6',
        isFinal: false
      }
    });
    await logActivity(null, null, 'CREATE_REFERRAL_PIPELINE', 'Settings', `Created referral stage: ${name}`);
    res.status(201).json({ id: newStage.id, name: newStage.name, order: newStage.sequence, color: newStage.color });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/referral-pipelines/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.referralPipeline.delete({
      where: { id }
    });
    res.json({ message: 'Referral stage deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Company Branding & Settings
app.get('/api/settings/branding', async (req, res) => {
  try {
    let settings = await prisma.companySettings.findUnique({
      where: { id: 'global_settings' }
    });
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          id: 'global_settings',
          companyName: 'Global CRM Cloud'
        }
      });
    }
    res.json({
      name: settings.companyName,
      logoText: settings.logoText || 'CRM 360',
      primaryColor: settings.primaryColor || '#2563EB',
      secondaryColor: settings.secondaryColor || '#0F172A'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/settings/branding', async (req, res) => {
  try {
    const { name, logoText, primaryColor, secondaryColor } = req.body;
    const settings = await prisma.companySettings.upsert({
      where: { id: 'global_settings' },
      create: {
        id: 'global_settings',
        companyName: name || 'Global CRM Cloud',
        logoText: logoText || 'CRM 360',
        primaryColor: primaryColor || '#2563EB',
        secondaryColor: secondaryColor || '#0F172A'
      },
      update: {
        companyName: name,
        logoText,
        primaryColor,
        secondaryColor
      }
    });

    await logActivity(null, null, 'UPDATE_BRANDING', 'Settings', `Updated company branding details.`);

    res.json({
      name: settings.companyName,
      logoText: settings.logoText,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/settings/logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    const formattedLogs = logs.map(l => ({
      id: l.id,
      timestamp: l.createdAt.toISOString(),
      user: l.userEmail || 'System',
      role: 'System',
      action: l.action,
      module: l.module,
      details: l.details
    }));
    res.json(formattedLogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Aggregated Dashboard & Analytics endpoints
app.get('/api/reports/analytics', async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany();
    const leads = await prisma.lead.findMany();
    const referrals = await prisma.referral.findMany({
      include: { currentStage: true }
    });
    const emailLogs = await prisma.emailLog.findMany();

    // Calculate revenue by pipeline stage
    const revenueByStage = opportunities.reduce((acc, opp) => {
      acc[opp.stageId] = (acc[opp.stageId] || 0) + (opp.dealValue || 0);
      return acc;
    }, {});

    // Calculate leads by source
    const leadSources = leads.reduce((acc, l) => {
      const source = l.source || 'Direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Pipeline stage counts
    const pipelineDistribution = opportunities.reduce((acc, opp) => {
      acc[opp.stageId] = (acc[opp.stageId] || 0) + 1;
      return acc;
    }, {});

    // Referral KPIs
    const conversions = referrals.filter(r => r.currentStage?.isFinal).length;
    const referralKPIs = {
      totalReferrers: new Set(referrals.map(r => r.referrerName).filter(Boolean)).size,
      referralRevenue: referrals.filter(r => r.currentStage?.isFinal).reduce((sum, r) => sum + (r.dealValue || 0), 0),
      conversions: conversions,
      rewardValue: referrals.filter(r => r.rewardStatus === 'Approved').length * 1000
    };

    // Email Stats
    const emailKPIs = {
      sent: emailLogs.filter(e => e.status === 'Sent' || e.status === 'SUCCESS').length,
      received: mockEmails.filter(e => e.folder === 'Inbox').length,
      replied: mockEmails.filter(e => e.replied).length,
      bounced: emailLogs.filter(e => e.status === 'Failed' || e.status === 'FAILED').length,
      openRate: 84,
      responseRate: 62
    };

    // Win/Loss ratio
    const wonDeals = opportunities.filter(o => o.stage?.toLowerCase() === 'won').length;
    const lostDeals = opportunities.filter(o => o.stage?.toLowerCase() === 'lost').length;

    res.json({
      revenueByStage,
      leadSources,
      pipelineDistribution,
      referralKPIs,
      emailKPIs,
      winLoss: { won: wonDeals, lost: lostDeals },
      categories: activeCategories,
      serviceTypes: activeServices
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`CRM Mock Express API running on port ${PORT}`);
});
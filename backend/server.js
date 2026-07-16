const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require("express-session");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

console.log(process.env.DATABASE_URL);
const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');
const leadRoutes = require("./src/routes/leadRoutes.js");
const activityRoutes = require("./src/routes/activityRoutes.js");
const authRoutes=require("./src/routes/authRoutes.js");

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

app.use(cors({
 origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  //origin: ['https://crm-360-2.onrender.com', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
    session({
        secret: process.env.SESSION_SECRET || "crm360-secret",
        resave: false,
        saveUninitialized: false,

        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false
        }
    })
);
app.use("/api/leads", leadRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/opportunities",opportunityRoutes);
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
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = seedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file. Re-seeding.", err);
    const initialData = seedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}


function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Log actions (Audit log)
function logActivity(db, user, action, module, details) {
  if (!db.auditLogs) {
    db.auditLogs = [];
  }
  const log = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    user: user ? user.name : 'System',
    role: user ? user.role : 'System',
    action,
    module,
    details
  };
  db.auditLogs.unshift(log);
  // Cap at 200 logs
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
}

// Default Seed Data
function seedDatabase() {
  const now = new Date();
  const subDays = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const db = {
    users: [
      { id: 'u_1', name: 'John Doe (SA)', email: 'superadmin@crm.com', password: 'password', role: 'Super Admin', phone: '+1 (555) 0199', company: 'Global Corp Enterprise' },
      { id: 'u_2', name: 'Sarah Connor', email: 'admin@crm.com', password: 'password', role: 'Admin', phone: '+1 (555) 0188', company: 'Global Corp Enterprise' },
      { id: 'u_3', name: 'Kyle Reese', email: 'user@crm.com', password: 'password', role: 'User', phone: '+1 (555) 0177', company: 'Global Corp Enterprise' }
    ],
    categories: ['Healthcare', 'Manufacturing', 'Education', 'Real Estate', 'E-Commerce', 'Finance', 'Logistics', 'Hospitality', 'IT Services'],
    serviceTypes: ['Service Based', 'Product Based'],
    pipelines: [
      { id: 'p_1', name: 'New', order: 1 },
      { id: 'p_2', name: 'Possible Response Received', order: 2 },
      { id: 'p_3', name: 'Discussion', order: 3 },
      { id: 'p_4', name: 'Proposal Preparation', order: 4 },
      { id: 'p_5', name: 'Negotiation', order: 5 },
      { id: 'p_6', name: 'Won', order: 6 },
      { id: 'p_7', name: 'Lost', order: 7 }
    ],
    referralPipelines: [
      { id: 'rp_1', name: 'Referral Submitted', order: 1 },
      { id: 'rp_2', name: 'Qualified', order: 2 },
      { id: 'rp_3', name: 'Proposal', order: 3 },
      { id: 'rp_4', name: 'Won', order: 4 },
      { id: 'rp_5', name: 'Reward Approved', order: 5 }
    ],
    leads: [
      { id: 'l_1', name: 'Dr. Elizabeth Blackwell', company: 'Blackwell Clinic Group', email: 'eblackwell@blackwellclinic.com', phone: '+1 (555) 0211', source: 'Website', serviceType: 'Service Based', category: 'Healthcare', status: 'New', assignedUser: 'Kyle Reese', createdDate: subDays(12), notes: 'Interested in full suite software upgrades for 4 hospitals.', campaign: 'Tech Expo 2026', team: 'Sales Team Alpha', city: 'Detroit', country: 'United States' },
      { id: 'l_2', name: 'Henry Ford II', company: 'Ford Manufacturing Labs', email: 'hford@fordmfg.com', phone: '+1 (555) 0222', source: 'Referral', serviceType: 'Product Based', category: 'Manufacturing', status: 'Contacted', assignedUser: 'Sarah Connor', createdDate: subDays(8), notes: 'Referred by Michael Scott. Interested in assembly line automation IoT.', campaign: 'None', team: 'Sales Team Beta', city: 'Detroit', country: 'United States' },
      { id: 'l_3', name: 'Marie Curie', company: 'Sorbonne Research Academy', email: 'mcurie@sorbonne.edu', phone: '+1 (555) 0233', source: 'Campaign', serviceType: 'Service Based', category: 'Education', status: 'Qualified', assignedUser: 'John Doe (SA)', createdDate: subDays(5), notes: 'Responded to summer scholarship cloud system campaign. Budget is tight but project is prestigious.', campaign: 'Summer Cloud Promo', team: 'Enterprise Core', city: 'Paris', country: 'France' },
      { id: 'l_4', name: 'Donald Trump Jr.', company: 'Trump Heights Real Estate', email: 'djunior@trumpheights.com', phone: '+1 (555) 0244', source: 'Manual Entry', serviceType: 'Service Based', category: 'Real Estate', status: 'New', assignedUser: 'Kyle Reese', createdDate: subDays(2), notes: 'Met at property tech expo. Requesting custom CRM portal integrations.', campaign: 'Tech Expo 2026', team: 'Sales Team Alpha', city: 'New York', country: 'United States' },
      { id: 'l_5', name: 'Jeff Bezos', company: 'Amazon Fulfillment Logistics', email: 'bezos@fulfillment.org', phone: '+1 (555) 0255', source: 'Email', serviceType: 'Product Based', category: 'Logistics', status: 'New', assignedUser: 'Sarah Connor', createdDate: subDays(1), notes: 'Inquired about warehouse tracking optimization dashboard licensing.', campaign: 'Summer Cloud Promo', team: 'Sales Team Beta', city: 'Seattle', country: 'United States' }
    ],
    opportunities: [
      { id: 'o_1', customerName: 'Bruce Wayne', company: 'Wayne Enterprises', dealValue: 250000, expectedClosing: subDays(-30), assignedSalesperson: 'Sarah Connor', priority: 'High', tags: ['SaaS', 'Security'], stageId: 'p_3', createdDate: subDays(30), campaign: 'None', team: 'Enterprise Core', city: 'Gotham', country: 'United States', source: 'Manual Entry' },
      { id: 'o_2', customerName: 'Tony Stark', company: 'Stark Industries', dealValue: 850000, expectedClosing: subDays(-15), assignedSalesperson: 'John Doe (SA)', priority: 'High', tags: ['Enterprise', 'AI'], stageId: 'p_5', createdDate: subDays(45), campaign: 'Tech Expo 2026', team: 'Enterprise Core', city: 'Metropolis', country: 'United States', source: 'Website' },
      { id: 'o_3', customerName: 'Clark Kent', company: 'Daily Planet Publishing', dealValue: 45000, expectedClosing: subDays(-45), assignedSalesperson: 'Kyle Reese', priority: 'Low', tags: ['CMS', 'Cloud'], stageId: 'p_6', createdDate: subDays(60), closedDate: subDays(45), campaign: 'Summer Cloud Promo', team: 'Sales Team Alpha', city: 'Metropolis', country: 'United States', source: 'Website' }, // Won
      { id: 'o_4', customerName: 'Peter Parker', company: 'Daily Bugle Photos', dealValue: 12000, expectedClosing: subDays(-5), assignedSalesperson: 'Kyle Reese', priority: 'Medium', tags: ['Upgrade'], stageId: 'p_2', createdDate: subDays(10), campaign: 'None', team: 'Sales Team Alpha', city: 'New York', country: 'United States', source: 'Referral' },
      { id: 'o_5', customerName: 'Lex Luthor', company: 'LexCorp Biotech', dealValue: 500000, expectedClosing: subDays(20), assignedSalesperson: 'Sarah Connor', priority: 'High', tags: ['Custom Development'], stageId: 'p_7', createdDate: subDays(25), closedDate: subDays(1), campaign: 'AI Promo', team: 'Sales Team Beta', city: 'Metropolis', country: 'United States', source: 'Email' }  // Lost
    ],
    activities: [
      { id: 'a_1', title: 'Stark Industries Proposal Review', type: 'Meeting', date: subDays(-1), time: '14:00', duration: '60', description: 'Review the proposal prep with Stark team online.', salesperson: 'John Doe (SA)', leadId: '', opportunityId: 'o_2', done: false },
      { id: 'a_2', title: 'Wayne Enterprises Discovery Call', type: 'Call', date: subDays(2), time: '10:30', duration: '30', description: 'Introduce Odoo style platform integrations.', salesperson: 'Sarah Connor', leadId: '', opportunityId: 'o_1', done: true },
      { id: 'a_3', title: 'Send Quote to Blackwell Clinic', type: 'Email', date: subDays(0), time: '09:00', duration: '15', description: 'Email quotation for hospital upgrade.', salesperson: 'Kyle Reese', leadId: 'l_1', opportunityId: '', done: false },
      { id: 'a_4', title: 'Follow-up with Donald Trump Jr.', type: 'Follow-up', date: subDays(-3), time: '16:00', duration: '20', description: 'Answer question about CRM integrations.', salesperson: 'Kyle Reese', leadId: 'l_4', opportunityId: '', done: false },
      { id: 'a_5', title: 'Contract Negotiation Meeting', type: 'Meeting', date: subDays(-4), time: '11:00', duration: '90', description: 'Final pricing discussions with Stark Corp.', salesperson: 'John Doe (SA)', leadId: '', opportunityId: 'o_2', done: false }
    ],
    emails: [
      {
        id: 'e_1',
        sender: 'tony@starkindustries.com',
        recipient: 'superadmin@crm.com',
        subject: 'Re: Stark CRM Proposal Draft',
        body: 'The proposal looks great John, but we need to ensure the Recharts analytics widget can ingest 50k events per second. Let\'s discuss in our meeting tomorrow.',
        folder: 'Inbox',
        date: subDays(1) + 'T14:32:00Z',
        read: false,
        replied: false,
        bounced: false,
        threadId: 'th_stark_1',
        history: [
          { sender: 'superadmin@crm.com', body: 'Hi Tony, attached is the draft proposal. Please let me know your thoughts.', date: subDays(2) + 'T09:15:00Z' },
          { sender: 'tony@starkindustries.com', body: 'Thanks, checking it now.', date: subDays(2) + 'T11:45:00Z' }
        ]
      },
      {
        id: 'e_2',
        sender: 'bruce@waynecorp.com',
        recipient: 'admin@crm.com',
        subject: 'Wayne Enterprises - Contract Updates',
        body: 'Sarah, I have requested my legal team to review the liability terms. Please expect updates by Thursday.',
        folder: 'Inbox',
        date: subDays(2) + 'T10:11:00Z',
        read: true,
        replied: true,
        bounced: false,
        threadId: 'th_wayne_1',
        history: []
      },
      {
        id: 'e_3',
        sender: 'superadmin@crm.com',
        recipient: 'clark@dailyplanet.com',
        subject: 'Welcome to CRM - Auto Enrollment Code',
        body: 'Hi Clark, congratulations on closing the deal! You are now auto-enrolled in our CRM Referral Program. Your referral code is REF-CLARK-99.',
        folder: 'Sent',
        date: subDays(4) + 'T16:00:00Z',
        read: true,
        replied: false,
        bounced: false,
        threadId: 'th_clark_ref_1',
        history: []
      },
      {
        id: 'e_4',
        sender: 'error-daemon@outlook.com',
        recipient: 'user@crm.com',
        subject: 'Delivery Status Notification (Failure)',
        body: 'The mail system failed to deliver the message to bad-email@unknown-hospital.org because the domain does not exist.',
        folder: 'Trash',
        date: subDays(3) + 'T18:22:00Z',
        read: true,
        replied: false,
        bounced: true,
        threadId: 'th_bounce_1',
        history: []
      }
    ],
    quotations: [
      {
        id: 'q_1',
        quoteNumber: 'QT-2026-001',
        clientName: 'Clark Kent',
        company: 'Daily Planet Publishing',
        opportunityId: 'o_3',
        date: subDays(60),
        status: 'Approved',
        taxRate: 8,
        discount: 2500,
        items: [
          { description: 'Enterprise Portal License (1 Year)', qty: 50, price: 800, total: 40000 },
          { description: 'Custom Dashboard Widget Module', qty: 1, price: 7500, total: 7500 }
        ],
        subtotal: 47500,
        taxAmount: 3800,
        grandTotal: 48800
      },
      {
        id: 'q_2',
        quoteNumber: 'QT-2026-002',
        clientName: 'Tony Stark',
        company: 'Stark Industries',
        opportunityId: 'o_2',
        date: subDays(5),
        status: 'Sent',
        taxRate: 10,
        discount: 50000,
        items: [
          { description: 'Dedicated CRM Server Clustering Setup', qty: 2, price: 200000, total: 400000 },
          { description: 'Premium API Integration & Support Tier', qty: 1, price: 500000, total: 500000 }
        ],
        subtotal: 900000,
        taxAmount: 90000,
        grandTotal: 940000
      },
      {
        id: 'q_3',
        quoteNumber: 'QT-2026-003',
        clientName: 'Bruce Wayne',
        company: 'Wayne Enterprises',
        opportunityId: 'o_1',
        date: subDays(1),
        status: 'Draft',
        taxRate: 8,
        discount: 10000,
        items: [
          { description: 'Cloud CRM SaaS Instance Setup', qty: 1, price: 150000, total: 150000 },
          { description: 'Consulting & Implementation Training', qty: 20, price: 5000, total: 100000 }
        ],
        subtotal: 250000,
        taxAmount: 20000,
        grandTotal: 260000
      }
    ],
    // referrals: [
    //   {
    //     id: 'ref_1',
    //     referrerName: 'Clark Kent', // Must be from Won opportunity (o_3)
    //     referrerCompany: 'Daily Planet Publishing',
    //     referredLeadName: 'Lois Lane',
    //     referredCompany: 'Metropolis Gazette',
    //     dealValue: 75000,
    //     stage: 'rp_3', // Proposal
    //     dateSubmitted: subDays(15),
    //     rewardType: 'Credits',
    //     rewardValue: '₹1,500 CRM Credits',
    //     rewardApproved: false
    //   },
    //   {
    //     id: 'ref_2',
    //     referrerName: 'Clark Kent',
    //     referrerCompany: 'Daily Planet Publishing',
    //     referredLeadName: 'Perry White',
    //     referredCompany: 'Tribune Press Group',
    //     dealValue: 120000,
    //     stage: 'rp_5', // Reward Approved
    //     dateSubmitted: subDays(40),
    //     rewardType: 'Discount on Future Projects',
    //     rewardValue: '15% Renewal Discount',
    //     rewardApproved: true
    //   }
    // ],
    // companyBranding: {
    //   name: 'Global CRM Cloud',
    //   primaryColor: '#2563EB',
    //   secondaryColor: '#0F172A',
    //   logoText: 'CRM 360'
    // },
    // auditLogs: [
    //   { id: 'log_init', timestamp: new Date().toISOString(), user: 'System', role: 'System', action: 'INITIALIZE', module: 'Database', details: 'CRM Mock DB initialized.' }
    // ]
  };

  return db;
}


// Auth routes are now handled via authRoutes.js mounted at /api/auth

// Users management is now handled via userRoutes.js mounted at /api/users

// Project Categories Management
app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

app.post('/api/categories', (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ message: 'Category name required' });
  const db = readDB();
  if (db.categories.includes(category)) return res.status(400).json({ message: 'Category already exists' });
  db.categories.push(category);
  logActivity(db, null, 'CREATE_CATEGORY', 'Settings', `Created project category: ${category}`);
  writeDB(db);
  res.json(db.categories);
});

app.delete('/api/categories/:name', (req, res) => {
  const { name } = req.params;
  const db = readDB();
  const index = db.categories.indexOf(name);
  if (index !== -1) {
    db.categories.splice(index, 1);
    logActivity(db, null, 'DELETE_CATEGORY', 'Settings', `Deleted project category: ${name}`);
    writeDB(db);
    return res.json(db.categories);
  }
  res.status(404).json({ message: 'Category not found' });
});

// Service Types Management
app.get('/api/services', (req, res) => {
  const db = readDB();
  res.json(db.serviceTypes);
});

// Leads


app.get('/api/leads', (req, res) => {
  const db = readDB();
  res.json(db.leads);
});

app.post('/api/leads', (req, res) => {
  const db = readDB();
  const newLead = {
    id: 'l_' + Date.now(),
    createdDate: new Date().toISOString().split('T')[0],
    status: 'New',
    ...req.body
  };
  db.leads.push(newLead);
  logActivity(db, null, 'CREATE_LEAD', 'Leads', `Created lead for ${newLead.name} at ${newLead.company}`);
  writeDB(db);
  res.status(201).json(newLead);
});

app.put('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.leads.findIndex(l => l.id === id);
  if (index !== -1) {
    db.leads[index] = { ...db.leads[index], ...req.body };
    logActivity(db, null, 'UPDATE_LEAD', 'Leads', `Updated lead ID: ${id}`);
    writeDB(db);
    return res.json(db.leads[index]);
  }
  res.status(404).json({ message: 'Lead not found' });
});

app.delete('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.leads.findIndex(l => l.id === id);
  if (index !== -1) {
    const lead = db.leads[index];
    db.leads.splice(index, 1);
    logActivity(db, null, 'DELETE_LEAD', 'Leads', `Deleted lead: ${lead.name} (${lead.company})`);
    writeDB(db);
    return res.json({ message: 'Lead deleted' });
  }
  res.status(404).json({ message: 'Lead not found' });
});

// Convert Lead to Opportunity
app.post('/api/leads/:id/convert', async (req, res) => {
  const { id } = req.params;
  const { dealValue, salesperson } = req.body;
  const db = readDB();
  
  // Find lead in db.json
  const leadIndex = db.leads.findIndex(l => l.id === id);
  let lead = null;
  if (leadIndex !== -1) {
    lead = db.leads[leadIndex];
    db.leads[leadIndex].status = 'New'; // set status to New instead of deleting
  }

  // Find lead in PostgreSQL Prisma
  let prismaLead = null;
  try {
    prismaLead = await prisma.lead.findUnique({ where: { id } });
    if (prismaLead) {
      await prisma.lead.update({
        where: { id },
        data: { status: 'New' }
      });
    }
  } catch (err) {
    console.error("Prisma error during lead conversion:", err);
  }

  if (!lead && !prismaLead) {
    return res.status(404).json({ message: 'Lead not found' });
  }

  const finalLead = lead || prismaLead;
  const sortedPipelines = [...db.pipelines].sort((a, b) => a.order - b.order);
  const newStage = db.pipelines.find(p => p.name.toLowerCase() === 'new') || sortedPipelines[0];
  const stageId = newStage ? newStage.id : 'p_1';

  const newOpportunity = {
    id: 'o_' + Date.now(),
    leadId: id, // Link to the original lead
    customerName: finalLead.contactName || finalLead.name || 'Unknown',
    company: finalLead.company,
    dealValue: Number(dealValue) || 10000,
    expectedClosing: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedSalesperson: salesperson || finalLead.assignedUser || 'Kyle Reese',
    priority: 0,
    tags: [],
    stageId: stageId, // Starts at the dynamic "New" pipeline stage
    createdDate: new Date().toISOString().split('T')[0]
  };

  db.opportunities.push(newOpportunity);
  logActivity(db, null, 'CONVERT_LEAD', 'Leads', `Converted lead ${newOpportunity.customerName} into Opportunity (Valued at ₹${newOpportunity.dealValue})`);
  writeDB(db);
  res.json({ message: 'Lead converted successfully', opportunity: newOpportunity });
});

// Pipelines Config (Sales Stages CRUD)
app.get('/api/pipelines', (req, res) => {
  const db = readDB();
  res.json(db.pipelines.sort((a, b) => a.order - b.order));
});

app.post('/api/pipelines', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Pipeline stage name required' });
  const db = readDB();
  const maxOrder = db.pipelines.reduce((max, p) => p.order > max ? p.order : max, 0);
  const newStage = {
    id: 'p_' + Date.now(),
    name,
    order: maxOrder + 1
  };
  db.pipelines.push(newStage);
  logActivity(db, null, 'CREATE_PIPELINE', 'Settings', `Created sales pipeline stage: ${name}`);
  writeDB(db);
  res.status(201).json(newStage);
});

app.put('/api/pipelines/:id', (req, res) => {
  const { id } = req.params;
  const { name, order } = req.body;
  const db = readDB();
  const index = db.pipelines.findIndex(p => p.id === id);
  if (index !== -1) {
    if (name) db.pipelines[index].name = name;
    if (order !== undefined) db.pipelines[index].order = Number(order);
    logActivity(db, null, 'UPDATE_PIPELINE', 'Settings', `Updated pipeline stage ID: ${id}`);
    writeDB(db);
    return res.json(db.pipelines[index]);
  }
  res.status(404).json({ message: 'Pipeline stage not found' });
});

app.post('/api/pipelines/reorder', (req, res) => {
  const { stages } = req.body; // Expect array of { id, order }
  if (!stages || !Array.isArray(stages)) return res.status(400).json({ message: 'Stages array required' });
  const db = readDB();
  stages.forEach(st => {
    const index = db.pipelines.findIndex(p => p.id === st.id);
    if (index !== -1) {
      db.pipelines[index].order = st.order;
    }
  });
  logActivity(db, null, 'REORDER_PIPELINE', 'Settings', `Reordered pipeline stages`);
  writeDB(db);
  res.json(db.pipelines.sort((a, b) => a.order - b.order));
});

app.delete('/api/pipelines/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.pipelines.findIndex(p => p.id === id);
  if (index !== -1) {
    const stage = db.pipelines[index];
    db.pipelines.splice(index, 1);
    // Re-link opportunities in this stage to the first stage if they exist
    const fallbackId = db.pipelines[0] ? db.pipelines[0].id : '';
    db.opportunities.forEach(opp => {
      if (opp.stageId === id) {
        opp.stageId = fallbackId;
      }
    });
    logActivity(db, null, 'DELETE_PIPELINE', 'Settings', `Deleted pipeline stage: ${stage.name}`);
    writeDB(db);
    return res.json({ message: 'Stage deleted', fallbackStageId: fallbackId });
  }
  res.status(404).json({ message: 'Pipeline stage not found' });
});

// Referral Pipelines Config (CRUD)
app.get('/api/referral-pipelines', (req, res) => {
  const db = readDB();
  res.json(db.referralPipelines.sort((a, b) => a.order - b.order));
});

app.post('/api/referral-pipelines', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Referral stage name required' });
  const db = readDB();
  const maxOrder = db.referralPipelines.reduce((max, p) => p.order > max ? p.order : max, 0);
  const newStage = {
    id: 'rp_' + Date.now(),
    name,
    order: maxOrder + 1
  };
  db.referralPipelines.push(newStage);
  logActivity(db, null, 'CREATE_REFERRAL_PIPELINE', 'Settings', `Created referral stage: ${name}`);
  writeDB(db);
  res.status(201).json(newStage);
});

app.delete('/api/referral-pipelines/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.referralPipelines.findIndex(p => p.id === id);
  if (index !== -1) {
    const stage = db.referralPipelines[index];
    db.referralPipelines.splice(index, 1);
    writeDB(db);
    return res.json({ message: 'Referral stage deleted' });
  }
  res.status(404).json({ message: 'Referral stage not found' });
});

// Opportunities (Kanban Cards)
app.get('/api/opportunities', (req, res) => {
  const db = readDB();
  res.json(db.opportunities);
});

app.post('/api/opportunities', (req, res) => {
  const db = readDB();
  const opp = {
    id: 'o_' + Date.now(),
    createdDate: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.opportunities.push(opp);
  logActivity(db, null, 'CREATE_OPPORTUNITY', 'Opportunities', `Created opportunity for ${opp.customerName} (${opp.company})`);
  writeDB(db);
  res.status(201).json(opp);
});

app.put('/api/opportunities/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.opportunities.findIndex(o => o.id === id);
  if (index !== -1) {
    const oldOpp = db.opportunities[index];
    db.opportunities[index] = { ...oldOpp, ...req.body };
    const updatedOpp = db.opportunities[index];

    // Auto-enroll in referrals if stage changed to Won ('p_6')
    if (req.body.stageId === 'p_6' && oldOpp.stageId !== 'p_6') {
      const isAlreadyReferrer = db.referrals.some(r => r.referrerName === oldOpp.customerName);
      if (!isAlreadyReferrer) {
        const newReferral = {
          id: 'ref_' + Date.now(),
          referrerName: oldOpp.customerName,
          referrerCompany: oldOpp.company,
          referredLeadName: 'Pending referral',
          referredCompany: 'Pending Company Corp',
          dealValue: 0,
          stage: 'rp_1',
          dateSubmitted: new Date().toISOString().split('T')[0],
          rewardType: 'Credits',
          rewardValue: '₹1,000 Credits',
          rewardApproved: false,
          placeholder: true
        };
        db.referrals.push(newReferral);
        logActivity(db, null, 'REFERRAL_AUTO_ENROLL', 'Referral Program', `Auto-enrolled client ${oldOpp.customerName} in referral program.`);
      }
    }

    // Update status of the original lead in both db.json and PostgreSQL when dragged/moved
    if (req.body.stageId && oldOpp.stageId !== req.body.stageId) {
      const stage = db.pipelines.find(p => p.id === req.body.stageId);
      if (stage) {
        const statusName = stage.name;

        // 1. Update in db.leads
        const leadId = updatedOpp.leadId;
        let leadIndex = -1;
        if (leadId) {
          leadIndex = db.leads.findIndex(l => l.id === leadId);
        } else {
          leadIndex = db.leads.findIndex(l => (l.contactName === updatedOpp.customerName || l.name === updatedOpp.customerName) && l.company === updatedOpp.company);
        }

        if (leadIndex !== -1) {
          db.leads[leadIndex].status = statusName;
        }

        // 2. Update in PostgreSQL
        try {
          if (leadId) {
            await prisma.lead.update({
              where: { id: leadId },
              data: { status: statusName }
            });
          } else {
            await prisma.lead.updateMany({
              where: {
                contactName: updatedOpp.customerName,
                company: updatedOpp.company
              },
              data: { status: statusName }
            });
          }
        } catch (err) {
          console.error("Prisma error during opportunity stage move:", err);
        }
      }
    }

    logActivity(db, null, 'UPDATE_OPPORTUNITY', 'Opportunities', `Updated opportunity: ${db.opportunities[index].company} (Stage: ${db.opportunities[index].stageId})`);
    writeDB(db);
    return res.json(db.opportunities[index]);
  }
  res.status(404).json({ message: 'Opportunity not found' });
});

app.delete('/api/opportunities/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.opportunities.findIndex(o => o.id === id);
  if (index !== -1) {
    const opp = db.opportunities[index];
    db.opportunities.splice(index, 1);
    logActivity(db, null, 'DELETE_OPPORTUNITY', 'Opportunities', `Deleted opportunity: ${opp.company}`);
    writeDB(db);
    return res.json({ message: 'Opportunity deleted' });
  }
  res.status(404).json({ message: 'Opportunity not found' });
});

// Activities (Calendar events)
app.get('/api/activities', (req, res) => {
  const db = readDB();
  res.json(db.activities);
});

app.post('/api/activities', (req, res) => {
  const db = readDB();
  const activity = {
    id: 'a_' + Date.now(),
    done: false,
    ...req.body
  };
  db.activities.push(activity);
  logActivity(db, null, 'CREATE_ACTIVITY', 'Activities', `Scheduled ${activity.type}: "${activity.title}"`);
  writeDB(db);
  res.status(201).json(activity);
});

app.put('/api/activities/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.activities.findIndex(a => a.id === id);
  if (index !== -1) {
    db.activities[index] = { ...db.activities[index], ...req.body };
    logActivity(db, null, 'UPDATE_ACTIVITY', 'Activities', `Updated activity ID: ${id}`);
    writeDB(db);
    return res.json(db.activities[index]);
  }
  res.status(404).json({ message: 'Activity not found' });
});

app.delete('/api/activities/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.activities.findIndex(a => a.id === id);
  if (index !== -1) {
    db.activities.splice(index, 1);
    writeDB(db);
    return res.json({ message: 'Activity deleted' });
  }
  res.status(404).json({ message: 'Activity not found' });
});

// Outlook Emails Integration Simulator
// app.get('/api/emails', (req, res) => {
//   const db = readDB();
//   res.json(db.emails);
// });

// app.post('/api/emails', (req, res) => {
//   const db = readDB();
//   const email = {
//     id: 'e_' + Date.now(),
//     date: new Date().toISOString(),
//     read: true,
//     replied: false,
//     bounced: false,
//     threadId: req.body.threadId || 'th_' + Date.now(),
//     history: req.body.history || [],
//     ...req.body
//   };
//   db.emails.unshift(email);
//   logActivity(db, null, 'SEND_EMAIL', 'Email Integration', `Sent email to ${email.recipient}: "${email.subject}"`);
//   writeDB(db);
//   res.status(201).json(email);
// });

// app.put('/api/emails/:id', (req, res) => {
//   const { id } = req.params;
//   const db = readDB();
//   const index = db.emails.findIndex(e => e.id === id);
//   if (index !== -1) {
//     db.emails[index] = { ...db.emails[index], ...req.body };
//     writeDB(db);
//     return res.json(db.emails[index]);
//   }
//   res.status(404).json({ message: 'Email not found' });
// });

// Quotations
app.get('/api/quotations', (req, res) => {
  const db = readDB();
  res.json(db.quotations);
});

app.post('/api/quotations', (req, res) => {
  const db = readDB();
  const { clientName, company, items, taxRate, discount, opportunityId } = req.body;

  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
  const taxAmount = Math.round(subtotal * (Number(taxRate) / 100));
  const grandTotal = subtotal + taxAmount - (Number(discount) || 0);

  const quote = {
    id: 'q_' + Date.now(),
    quoteNumber: 'QT-2026-0' + (db.quotations.length + 1),
    clientName,
    company,
    opportunityId: opportunityId || '',
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    items,
    taxRate,
    discount,
    subtotal,
    taxAmount,
    grandTotal
  };

  db.quotations.push(quote);
  logActivity(db, null, 'CREATE_QUOTATION', 'Quotations', `Created quotation ${quote.quoteNumber} for ${quote.company} (₹${quote.grandTotal})`);
  writeDB(db);
  res.status(201).json(quote);
});

app.put('/api/quotations/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.quotations.findIndex(q => q.id === id);
  if (index !== -1) {
    const current = db.quotations[index];
    const updated = { ...current, ...req.body };

    if (req.body.items || req.body.taxRate !== undefined || req.body.discount !== undefined) {
      const items = updated.items || [];
      const taxRate = updated.taxRate || 0;
      const discount = updated.discount || 0;

      updated.subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
      updated.taxAmount = Math.round(updated.subtotal * (Number(taxRate) / 100));
      updated.grandTotal = updated.subtotal + updated.taxAmount - Number(discount);
    }

    db.quotations[index] = updated;
    logActivity(db, null, 'UPDATE_QUOTATION', 'Quotations', `Updated quotation: ${updated.quoteNumber} (Status: ${updated.status})`);
    writeDB(db);
    return res.json(db.quotations[index]);
  }
  res.status(404).json({ message: 'Quotation not found' });
});


// Company Branding & Settings
app.get('/api/settings/branding', (req, res) => {
  const db = readDB();
  res.json(db.companyBranding || {
    name: 'Global CRM Cloud',
    primaryColor: '#2563EB',
    secondaryColor: '#0F172A',
    logoText: 'CRM 360'
  });
});

app.put('/api/settings/branding', (req, res) => {
  const db = readDB();
  const defaultBranding = {
    name: 'Global CRM Cloud',
    primaryColor: '#2563EB',
    secondaryColor: '#0F172A',
    logoText: 'CRM 360'
  };
  db.companyBranding = { ...defaultBranding, ...db.companyBranding, ...req.body };
  logActivity(db, null, 'UPDATE_BRANDING', 'Settings', `Updated company branding details.`);
  writeDB(db);
  res.json(db.companyBranding);
});

app.get('/api/settings/logs', (req, res) => {
  const db = readDB();
  res.json(db.auditLogs);
});

// Aggregated Dashboard & Analytics endpoints
app.get('/api/reports/analytics', (req, res) => {
  const db = readDB();
  
  // Calculate revenue by pipeline stage
  const revenueByStage = db.opportunities.reduce((acc, opp) => {
    acc[opp.stageId] = (acc[opp.stageId] || 0) + opp.dealValue;
    return acc;
  }, {});

  // Calculate leads by source
  const leadSources = db.leads.reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});

  // Pipeline stage counts
  const pipelineDistribution = db.opportunities.reduce((acc, opp) => {
    acc[opp.stageId] = (acc[opp.stageId] || 0) + 1;
    return acc;
  }, {});

  // Referral KPIs
  const referralKPIs = {
    totalReferrers: new Set(db.referrals.map(r => r.referrerName)).size,
    referralRevenue: db.referrals.filter(r => r.stage === 'rp_4' || r.stage === 'rp_5').reduce((sum, r) => sum + r.dealValue, 0),
    conversions: db.referrals.filter(r => r.stage === 'rp_4' || r.stage === 'rp_5').length,
    rewardValue: db.referrals.filter(r => r.rewardApproved).length * 1000 // mock calculation
  };

  // Email Stats
  const emailKPIs = {
    sent: db.emails.filter(e => e.folder === 'Sent').length,
    received: db.emails.filter(e => e.folder === 'Inbox').length,
    replied: db.emails.filter(e => e.replied).length,
    bounced: db.emails.filter(e => e.bounced).length,
    openRate: 84, // static percentages for visual dashboard realism
    responseRate: 62
  };

  // Win/Loss ratio
  const wonDeals = db.opportunities.filter(o => o.stageId === 'p_6').length;
  const lostDeals = db.opportunities.filter(o => o.stageId === 'p_7').length;

  res.json({
    revenueByStage,
    leadSources,
    pipelineDistribution,
    referralKPIs,
    emailKPIs,
    winLoss: { won: wonDeals, lost: lostDeals },
    categories: db.categories,
    serviceTypes: db.serviceTypes
  });
});

app.listen(PORT, () => {
  console.log(`CRM Mock Express API running on port ${PORT}`);
});
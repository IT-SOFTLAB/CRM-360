const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createLead = async (req, res) => {
  try {
    const now = new Date();
    // Shift manual creation time to IST timezone (+5.5 hours)
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const user = req.user;

    const userRole = (user.role || '').toUpperCase().replace(/[\s_]+/g, '_');
    const assignedUserId = userRole === 'USER' ? user.id : req.body.assignedUserId;
    const assignedUser = userRole === 'USER' ? user.name : req.body.assignedUser;

    const lead = await prisma.lead.create({
      data: {
        contactName: req.body.contactName,
        company: req.body.company,
        email: req.body.email,
        phone: req.body.phone,
        category: req.body.category,
        serviceType: req.body.serviceType,
        assignedUser: assignedUser || null,
        assignedUserId: assignedUserId || null,
        status: 'New',
        createdAt: istNow
      }
    });

    // Send assignment notification email
    if (assignedUserId) {
      const { sendLeadAssignmentEmail } = require('../services/leadEmailService');
      const leadInfoForEmail = [{
        contactName: lead.contactName,
        company: lead.company,
        email: lead.email
      }];
      sendLeadAssignmentEmail(req, assignedUserId, leadInfoForEmail).catch(err => {
        console.error("Error sending assignment email in createLead:", err);
      });
    }

    res.status(201).json(lead);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
  }
};

const getAllLeads = async (req, res) => {
  try {
    const user = req.user;
    const userRole = (user.role || '').toUpperCase().replace(/[\s_]+/g, '_');

    let whereClause = {};
    if (userRole === 'USER') {
      whereClause = {
        OR: [
          { assignedUserId: user.id },
          { assignedUser: user.name }
        ]
      };
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.status(200).json(leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message
    });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.lead.delete({
      where: {
           id: id
      }
    });

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current lead to check if assignee changed
    const currentLead = await prisma.lead.findUnique({
      where: { id }
    });

    const lead = await prisma.lead.update({
      where: {
    id: id
  },
      data: {
    contactName: req.body.contactName,
    company: req.body.company,
    source: req.body.source,
    email: req.body.email,
    phone: req.body.phone,
    category: req.body.category,
    serviceType: req.body.serviceType,
    assignedUser: req.body.assignedUser,
    assignedUserId: req.body.assignedUserId,
    status: req.body.status
  }
    });

    // Send single lead assignment email if assignee changed and is not null
    const assignedUserIdChanged = 
      req.body.assignedUserId !== undefined && 
      req.body.assignedUserId !== currentLead?.assignedUserId;

    if (assignedUserIdChanged && req.body.assignedUserId) {
      const { sendLeadAssignmentEmail } = require('../services/leadEmailService');
      const leadInfoForEmail = [{
        contactName: lead.contactName,
        company: lead.company,
        email: lead.email
      }];
      sendLeadAssignmentEmail(req, req.body.assignedUserId, leadInfoForEmail).catch(err => {
        console.error("Error sending single lead assign email:", err);
      });
    }

    // Also update associated opportunity and customer if salesperson changes
    if (req.body.assignedUser !== undefined || req.body.assignedUserId !== undefined) {
      await prisma.opportunity.updateMany({
        where: { leadId: id },
        data: {
          assignedSalesperson: req.body.assignedUser,
          assignedSalespersonId: req.body.assignedUserId
        }
      });
      const opps = await prisma.opportunity.findMany({
        where: { leadId: id },
        select: { id: true }
      });
      const oppIds = opps.map(o => o.id);
      if (oppIds.length > 0) {
        await prisma.customer.updateMany({
          where: { opportunityId: { in: oppIds } },
          data: {
            assignedSalesperson: req.body.assignedUser,
            assignedSalespersonId: req.body.assignedUserId
          }
        });
      }
    }

    // Also update db.json to keep them synced
    const db = readDB();
    const idx = db.leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      db.leads[idx] = {
        ...db.leads[idx],
        contactName: req.body.contactName,
        name: req.body.contactName || db.leads[idx].name,
        company: req.body.company,
        source: req.body.source,
        email: req.body.email,
        phone: req.body.phone,
        category: req.body.category,
        serviceType: req.body.serviceType,
        assignedUser: req.body.assignedUser,
        assignedUserId: req.body.assignedUserId,
        status: req.body.status
      };

      // Update associated opportunity and customer in db.json
      const oppIdx = db.opportunities.findIndex(o => o.leadId === id);
      if (oppIdx !== -1) {
        db.opportunities[oppIdx].assignedSalesperson = req.body.assignedUser;
        db.opportunities[oppIdx].assignedSalespersonId = req.body.assignedUserId;

        const oppId = db.opportunities[oppIdx].id;
        const custIdx = db.customers.findIndex(c => c.opportunityId === oppId);
        if (custIdx !== -1) {
          db.customers[custIdx].assignedSalesperson = req.body.assignedUser;
          db.customers[custIdx].assignedSalespersonId = req.body.assignedUserId;
        }
      }
      writeDB(db);
    }

    res.status(200).json(lead);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, '../../db.json');

function readDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error("Error reading db.json in leadController", e);
    }
  }
  return { leads: [] };
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing db.json in leadController", e);
  }
}

const normalizeKey = (k) => (k ? k.toString().replace(/[\s_-]+/g, '').toLowerCase() : '');

function getVal(row, keyNames) {
  const cleanRow = {};
  for (const k of Object.keys(row)) {
    cleanRow[normalizeKey(k)] = row[k];
  }
  for (const name of keyNames) {
    const normName = normalizeKey(name);
    if (cleanRow[normName] !== undefined && cleanRow[normName] !== null) {
      return cleanRow[normName];
    }
  }
  return null;
}

const importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Read the file using xlsx (works for both CSV and Excel)
    let workbook;
    try {
      workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    } catch (err) {
      console.error('Error reading file with xlsx:', err);
      return res.status(400).json({ success: false, message: 'Failed to parse CSV/Excel file structure' });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get headers from first row
    const sheetRows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = sheetRows[0] || [];

    // Header validation (case/space/underscore/dash insensitive)
    const normalizedHeaders = headers.map(normalizeKey);
    const required = ['contactName', 'category', 'serviceType'];
    const hasAllRequired = required.every(field => {
      const normField = normalizeKey(field);
      return normalizedHeaders.includes(normField);
    });

    if (!hasAllRequired) {
      return res.status(400).json({ 
        success: false, 
        message: 'uploading failed the csv file does not match the required fields' 
      });
    }

    // Convert sheet to JSON array of objects
    const results = xlsx.utils.sheet_to_json(worksheet);
    const createdLeads = [];

    const { teamId } = req.query;
    let initialAssigneeName = req.user?.name || 'Admin';
    let initialAssigneeId = req.user?.id || null;

    if (teamId) {
      try {
        const team = await prisma.salesTeam.findUnique({
          where: { id: teamId },
          include: { leader: true, members: { select: { id: true, name: true } } }
        });
        if (team) {
          if (team.leader) {
            initialAssigneeName = team.leader.name;
            initialAssigneeId = team.leader.id;
          } else if (team.members && team.members.length > 0) {
            initialAssigneeName = team.members[0].name;
            initialAssigneeId = team.members[0].id;
          }
        }
      } catch (teamErr) {
        console.warn('Failed to resolve team leader for import:', teamErr.message);
      }
    }
    
    const db = readDB();
    if (!db.leads) db.leads = [];

    for (const row of results) {
      // Find fields case-insensitively and trim keys/values
      const contactName = getVal(row, ['contactName', 'name']);
      
      // Validate required field
      if (!contactName || !contactName.toString().trim()) {
        continue; // Skip invalid records missing a name
      }

      const company = getVal(row, ['company']);
      const email = getVal(row, ['email']);
      const phone = getVal(row, ['phone']);
      const category = getVal(row, ['category']) || 'Healthcare';
      const serviceType = getVal(row, ['serviceType', 'servicetype']) || 'Service Based';
      const assignedUser = getVal(row, ['assignedUser', 'assigneduser']);
      const createdAt = getVal(row, ['createdAt', 'createdat', 'createdDate', 'createddate']);

      const trimmedName = contactName.toString().trim();
      const trimmedCompany = company ? company.toString().trim() : null;
      const trimmedSource = 'CSV/Excel Import'; // Default source since it's not in the sheet anymore
      const trimmedEmail = email ? email.toString().trim() : null;
      const trimmedPhone = phone ? phone.toString().trim() : null;
      const trimmedCategory = category.toString().trim();
      const trimmedServiceType = serviceType.toString().trim();
      const trimmedAssignedUser = initialAssigneeName;
      const trimmedAssignedUserId = initialAssigneeId;

      // Handle createdAt date parsing (supporting strings and Excel serial date numbers)
      let parsedCreatedAt = new Date();
      if (createdAt) {
        const serial = Number(createdAt);
        if (!isNaN(serial) && serial > 20000 && serial < 60000) {
          // Parse Excel serial date number
          parsedCreatedAt = new Date(Math.round((serial - 25569) * 86400 * 1000));
        } else {
          const tempDate = new Date(createdAt);
          if (!isNaN(tempDate.getTime())) {
            parsedCreatedAt = tempDate;
          }
        }
      }
      // Shift import creation time to IST timezone (+5.5 hours)
      const istParsedCreatedAt = new Date(parsedCreatedAt.getTime() + 5.5 * 60 * 60 * 1000);

      // 1. Save to Prisma Database (PostgreSQL)
      let lead;
      try {
        lead = await prisma.lead.create({
          data: {
            contactName: trimmedName,
            company: trimmedCompany,
            email: trimmedEmail,
            phone: trimmedPhone,
            category: trimmedCategory,
            serviceType: trimmedServiceType,
            assignedUser: trimmedAssignedUser,
            assignedUserId: trimmedAssignedUserId,
            status: 'New', // Automatically set status to "New"
            createdAt: istParsedCreatedAt
          }
        });
      } catch (dbErr) {
        console.warn('Prisma lead create failed, proceeding to save to db.json only:', dbErr.message);
        lead = {
          id: 'l_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          createdAt: istParsedCreatedAt.toISOString()
        };
      }

      // 2. Save to db.json for fallback / mock compatibility
      const dbLead = {
        id: lead.id || 'l_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: trimmedName,          // compat with db.json structure
        contactName: trimmedName,   // compat with frontend expected field
        company: trimmedCompany,
        source: trimmedSource,
        email: trimmedEmail,
        phone: trimmedPhone,
        category: trimmedCategory,
        serviceType: trimmedServiceType,
        assignedUser: trimmedAssignedUser,
        assignedUserId: trimmedAssignedUserId,
        status: 'New',              // Automatically set status to "New"
        createdAt: parsedCreatedAt.toISOString().split('T')[0],
        createdDate: parsedCreatedAt.toISOString().split('T')[0]
      };

      db.leads.push(dbLead);
      createdLeads.push(dbLead);
    }

    // Write back to db.json
    writeDB(db);

    res.status(200).json({
      success: true,
      message: `Successfully imported ${createdLeads.length} leads.`,
      leadsCount: createdLeads.length
    });

  } catch (error) {
    console.error('Import controller error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const bulkAssignLeads = async (req, res) => {
  try {
    const { ids, assignedUser, assignedUserId } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No leads selected' });
    }

    // Fetch leads details for email notification
    const leadsForEmail = await prisma.lead.findMany({
      where: {
        id: { in: ids }
      },
      select: {
        contactName: true,
        company: true,
        email: true
      }
    });

    // 1. Update in PostgreSQL
    const updated = await prisma.lead.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        assignedUser,
        assignedUserId
      }
    });

    // 2. Update associated opportunities in PostgreSQL
    await prisma.opportunity.updateMany({
      where: {
        leadId: { in: ids }
      },
      data: {
        assignedSalesperson: assignedUser,
        assignedSalespersonId: assignedUserId
      }
    });

    // Update associated customers in PostgreSQL
    const opps = await prisma.opportunity.findMany({
      where: { leadId: { in: ids } },
      select: { id: true }
    });
    const oppIds = opps.map(o => o.id);
    if (oppIds.length > 0) {
      await prisma.customer.updateMany({
        where: { opportunityId: { in: oppIds } },
        data: {
          assignedSalesperson: assignedUser,
          assignedSalespersonId: assignedUserId
        }
      });
    }

    // 3. Update db.json
    const db = readDB();
    ids.forEach(id => {
      const idx = db.leads.findIndex(l => l.id === id);
      if (idx !== -1) {
        db.leads[idx].assignedUser = assignedUser;
        db.leads[idx].assignedUserId = assignedUserId;
      }

      // Update associated opportunity in db.json
      const oppIdx = db.opportunities.findIndex(o => o.leadId === id);
      if (oppIdx !== -1) {
        db.opportunities[oppIdx].assignedSalesperson = assignedUser;
        db.opportunities[oppIdx].assignedSalespersonId = assignedUserId;

        const oppId = db.opportunities[oppIdx].id;
        const custIdx = db.customers.findIndex(c => c.opportunityId === oppId);
        if (custIdx !== -1) {
          db.customers[custIdx].assignedSalesperson = req.body.assignedUser;
          db.customers[custIdx].assignedSalespersonId = req.body.assignedUserId;
        }
      }
    });
    writeDB(db);

    // Send email notification
    if (assignedUserId) {
      const { sendLeadAssignmentEmail } = require('../services/leadEmailService');
      sendLeadAssignmentEmail(req, assignedUserId, leadsForEmail).catch(err => {
        console.error("Error sending bulk lead assign email:", err);
      });
    }

    res.status(200).json({ success: true, message: `Successfully assigned ${ids.length} leads`, updatedCount: updated.count });
  } catch (error) {
    console.error('Bulk assign leads error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLead, getAllLeads, deleteLead, updateLead, importLeads, bulkAssignLeads
};
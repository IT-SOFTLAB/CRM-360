const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createLead = async (req, res) => {
  try {
    const now = new Date();
    const localDateZeroTime = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const lead = await prisma.lead.create({
      data: {
        contactName: req.body.contactName,
        company: req.body.company,
        source: req.body.source,
        email: req.body.email,
        phone: req.body.phone,
        category: req.body.category,
        serviceType: req.body.serviceType,
        assignedUser: req.body.assignedUser,
        createdAt: localDateZeroTime
      }
    });

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
    const leads = await prisma.lead.findMany({
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
    status: req.body.status
  }
    });

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
      const trimmedAssignedUser = assignedUser ? assignedUser.toString().trim() : null;

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
      // Zero out the time portion to keep only the date
      parsedCreatedAt = new Date(Date.UTC(parsedCreatedAt.getFullYear(), parsedCreatedAt.getMonth(), parsedCreatedAt.getDate()));

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
            status: 'New', // Automatically set status to "New"
            createdAt: parsedCreatedAt
          }
        });
      } catch (dbErr) {
        console.warn('Prisma lead create failed, proceeding to save to db.json only:', dbErr.message);
        lead = {
          id: 'l_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          createdAt: parsedCreatedAt.toISOString()
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

module.exports = {
  createLead, getAllLeads, deleteLead, updateLead, importLeads
};
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../db.json');

const readDB = () => {
  if (!fs.existsSync(dbPath)) return { leads: [], opportunities: [], customers: [] };
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

/*
==================================
GET ALL CUSTOMERS
==================================
*/

exports.getCustomers = async (req, res) => {
  try {
    const user = req.user;
    const userRole = (user.role || '').toUpperCase().replace(/[\s_]+/g, '_');

    let whereClause = {};
    if (userRole === 'USER') {
      whereClause = { assignedSalesperson: user.name };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(customers);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });
  }
};

/*
==================================
GET SINGLE CUSTOMER
==================================
*/

exports.getCustomerById = async (req, res) => {

  try {

    const customer = await prisma.customer.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json(customer);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });

  }

};
/*
==================================
CREATE CUSTOMER
==================================
*/

exports.createCustomer = async (req, res) => {

  try {

    const {

      opportunityId,
      customerName,
      company,
      email,
      phone,
      assignedSalesperson,
      dealValue

    } = req.body;

    const customer = await prisma.customer.create({

      data: {

        opportunityId,

        customerName,

        company,

        email,

        phone,

        assignedSalesperson,
        dealValue

      }

    });

    res.status(201).json(customer);

  } catch (err) {

    console.log(err);

    res.status(500).json({

      message: "Server Error"

    });

  }

};

/*
==================================
UPDATE CUSTOMER
==================================
*/

exports.updateCustomer = async (req, res) => {

  try {

    const { id } = req.params;

    const customer = await prisma.customer.update({

      where: {
        id
      },

      data: req.body

    });

    // Sync associated Opportunity & Lead in PostgreSQL
    if (req.body.assignedSalesperson !== undefined || req.body.assignedSalespersonId !== undefined) {
      const oppId = customer.opportunityId;
      if (oppId) {
        // Update Opportunity
        const updatedOpp = await prisma.opportunity.update({
          where: { id: oppId },
          data: {
            assignedSalesperson: req.body.assignedSalesperson,
            assignedSalespersonId: req.body.assignedSalespersonId
          }
        });

        // Update Lead
        if (updatedOpp.leadId) {
          await prisma.lead.update({
            where: { id: updatedOpp.leadId },
            data: {
              assignedUser: req.body.assignedSalesperson,
              assignedUserId: req.body.assignedSalespersonId
            }
          });
        }
      }
    }

    // Sync to db.json
    try {
      const db = readDB();
      const idx = db.customers.findIndex(c => c.id === id);
      if (idx !== -1) {
        db.customers[idx] = { ...db.customers[idx], ...req.body };

        // Sync opportunity and lead in db.json
        const oppId = db.customers[idx].opportunityId;
        if (oppId) {
          const oppIdx = db.opportunities.findIndex(o => o.id === oppId);
          if (oppIdx !== -1) {
            db.opportunities[oppIdx].assignedSalesperson = req.body.assignedSalesperson;
            db.opportunities[oppIdx].assignedSalespersonId = req.body.assignedSalespersonId;

            const leadId = db.opportunities[oppIdx].leadId;
            if (leadId) {
              const leadIdx = db.leads.findIndex(l => l.id === leadId);
              if (leadIdx !== -1) {
                db.leads[leadIdx].assignedUser = req.body.assignedSalesperson;
                db.leads[leadIdx].assignedUserId = req.body.assignedSalespersonId;
              }
            }
          }
        }
        writeDB(db);
      }
    } catch (dbErr) {
      console.error("Error syncing db.json in updateCustomer:", dbErr);
    }

    res.json(customer);

  } catch (err) {

    console.log(err);

    res.status(500).json({

      message: "Server Error"

    });

  }

};

/*
==================================
DELETE CUSTOMER
==================================
*/

exports.deleteCustomer = async (req, res) => {

  try {

    await prisma.customer.delete({
      where: {
        id: req.params.id
      }
    });

    res.json({
      message: "Customer deleted successfully"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });

  }

};
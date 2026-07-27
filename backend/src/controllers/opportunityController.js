const { PrismaClient } = require("@prisma/client");
const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, '../../db.json');

const prisma = new PrismaClient();

function readDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error("Error reading db.json in opportunityController", e);
    }
  }
  return { opportunities: [] };
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing db.json in opportunityController", e);
  }
}

/*
GET ALL
*/

exports.getAllOpportunities = async (req, res) => {
    try {
        const user = req.user;
        const userRole = (user.role || '').toUpperCase().replace(/[\s_]+/g, '_');

        let whereClause = {};
        if (userRole === 'USER') {
            whereClause = {
                OR: [
                    { assignedSalespersonId: user.id },
                    { assignedSalesperson: user.name }
                ]
            };
        }

        const opportunities = await prisma.opportunity.findMany({
            where: whereClause,
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json(opportunities);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }
};


/*
GET ONE
*/

exports.getOpportunity = async (req, res) => {

    try {

        const { id } = req.params;

        const opportunity = await prisma.opportunity.findUnique({

            where: {
                id
            }

        });

        if (!opportunity) {

            return res.status(404).json({
                message: "Opportunity Not Found"
            });

        }

        res.json(opportunity);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

exports.createOpportunity = async (req, res) => {

    try {

        const {

            leadId,
            customerName,
            company,
            email,
            phone,
            dealValue,
            assignedSalesperson,
            expectedClosing

        } = req.body;


        const opportunity = await prisma.opportunity.create({

            data: {

                leadId,

                customerName,

                company,

                email,

                phone,

                dealValue: Number(dealValue),

                assignedSalesperson,

                expectedClosing: expectedClosing
                    ? new Date(expectedClosing)
                    : null

            }

        });

        res.status(201).json(opportunity);

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: "Server Error"

        });

    }

};
exports.updateOpportunity = async (req, res) => {
  try {

    const { id } = req.params;

    const updatedOpportunity = await prisma.opportunity.update({
      where: { id },
      data: req.body
    });

    // Also update associated lead and customer if salesperson changes
    if (req.body.assignedSalesperson !== undefined || req.body.assignedSalespersonId !== undefined) {
      const leadId = updatedOpportunity.leadId;
      if (leadId) {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            assignedUser: req.body.assignedSalesperson,
            assignedUserId: req.body.assignedSalespersonId
          }
        });
      }
      await prisma.customer.updateMany({
        where: { opportunityId: id },
        data: {
          assignedSalesperson: req.body.assignedSalesperson,
          assignedSalespersonId: req.body.assignedSalespersonId
        }
      });
    }

    // Create customer when moved to Won
    if (req.body.stage === "Won") {

      const existingCustomer = await prisma.customer.findFirst({
        where: {
          opportunityId: id
        }
      });

      if (!existingCustomer) {

        await prisma.customer.create({
          data: {
            opportunityId: updatedOpportunity.id,
            customerName: updatedOpportunity.customerName,
            company: updatedOpportunity.company,
            email: updatedOpportunity.email,
            phone: updatedOpportunity.phone,
            assignedSalesperson: updatedOpportunity.assignedSalesperson,
            dealValue: updatedOpportunity.dealValue
          }
        });

      }
    }

    res.json(updatedOpportunity);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error"
    });

  }
};
exports.deleteOpportunity = async (req, res) => {

    try {

        const { id } = req.params;

        await prisma.opportunity.delete({

            where: { id }

        });

        res.json({

            message: "Deleted Successfully"

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            message: "Server Error"

        });

    }

};


exports.convertLeadToOpportunity = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { dealValue, salesperson } = req.body;

    // Find Lead
    const lead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // Check if already converted
    const existing = await prisma.opportunity.findFirst({
      where: {
        leadId,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "Lead already converted",
      });
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        leadId: lead.id,
        customerName: lead.contactName,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        dealValue: Number(dealValue),
        assignedSalesperson:
          salesperson ||
          lead.assignedUser ||
          "Unassigned",
        stage: "New",
        priority: 0,
        tags: [],
        expectedClosing: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
      },
    });

    // Update Lead Status
    await prisma.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        status: "Converted",
      },
    });

    res.status(201).json({
      message: "Lead converted successfully",
      opportunity,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.bulkDeleteOpportunities = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No opportunities selected",
      });
    }

    await prisma.opportunity.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.bulkAssignOpportunities = async (req, res) => {
  try {
    const { ids, assignedSalesperson, assignedSalespersonId } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No opportunities selected",
      });
    }

    // 1. Get opportunities to find leadIds
    const opps = await prisma.opportunity.findMany({
      where: { id: { in: ids } },
      select: { leadId: true }
    });
    const leadIds = opps.map(o => o.leadId).filter(Boolean);

    // 2. Update in PostgreSQL
    const updated = await prisma.opportunity.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        assignedSalesperson,
        assignedSalespersonId,
      },
    });

    // 3. Update associated leads in PostgreSQL
    if (leadIds.length > 0) {
      await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: {
          assignedUser: assignedSalesperson,
          assignedUserId: assignedSalespersonId
        }
      });
    }

    // Update associated customers in PostgreSQL
    await prisma.customer.updateMany({
      where: { opportunityId: { in: ids } },
      data: {
        assignedSalesperson,
        assignedSalespersonId
      }
    });

    // 4. Update db.json
    const db = readDB();
    ids.forEach(id => {
      const idx = db.opportunities.findIndex(o => o.id === id);
      if (idx !== -1) {
        db.opportunities[idx].assignedSalesperson = assignedSalesperson;
        db.opportunities[idx].assignedSalespersonId = assignedSalespersonId;

        // Find associated lead in db.json
        const lId = db.opportunities[idx].leadId;
        if (lId) {
          const lIdx = db.leads.findIndex(l => l.id === lId);
          if (lIdx !== -1) {
            db.leads[lIdx].assignedUser = assignedSalesperson;
            db.leads[lIdx].assignedUserId = assignedSalespersonId;
          }
        }

        // Update associated customer in db.json
        const custIdx = db.customers.findIndex(c => c.opportunityId === id);
        if (custIdx !== -1) {
          db.customers[custIdx].assignedSalesperson = assignedSalesperson;
          db.customers[custIdx].assignedSalespersonId = assignedSalespersonId;
        }
      }
    });
    writeDB(db);

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${ids.length} opportunities`,
      updatedCount: updated.count
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
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

    const oppUpdateData = { ...req.body };
    delete oppUpdateData.category;
    delete oppUpdateData.serviceType;

    const updatedOpportunity = await prisma.opportunity.update({
      where: { id },
      data: oppUpdateData
    });

    const leadId = updatedOpportunity.leadId;

    // Also update associated lead and customer if salesperson changes
    if (req.body.assignedSalesperson !== undefined || req.body.assignedSalespersonId !== undefined) {
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

    // Also update associated lead's status if stage changes
    if (req.body.stage !== undefined) {
      if (leadId) {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            status: req.body.stage
          }
        });
      }
    }

    // Also update associated lead details if key fields change
    if (leadId) {
      const leadUpdateData = {};
      if (req.body.customerName !== undefined) leadUpdateData.contactName = req.body.customerName;
      if (req.body.company !== undefined) leadUpdateData.company = req.body.company;
      if (req.body.email !== undefined) leadUpdateData.email = req.body.email;
      if (req.body.phone !== undefined) leadUpdateData.phone = req.body.phone;
      if (req.body.dealValue !== undefined) leadUpdateData.dealValue = req.body.dealValue ? Number(req.body.dealValue) : 0;
      if (req.body.category !== undefined) leadUpdateData.category = req.body.category;
      if (req.body.serviceType !== undefined) leadUpdateData.serviceType = req.body.serviceType;
      
      if (Object.keys(leadUpdateData).length > 0) {
        await prisma.lead.update({
          where: { id: leadId },
          data: leadUpdateData
        }).catch(err => console.log("Associated lead update failed:", err.message));
      }
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

    // Also update db.json to keep them synced
    const db = readDB();
    const oppIdx = db.opportunities.findIndex(o => o.id === id);
    if (oppIdx !== -1) {
      db.opportunities[oppIdx] = {
        ...db.opportunities[oppIdx],
        customerName: req.body.customerName !== undefined ? req.body.customerName : db.opportunities[oppIdx].customerName,
        company: req.body.company !== undefined ? req.body.company : db.opportunities[oppIdx].company,
        email: req.body.email !== undefined ? req.body.email : db.opportunities[oppIdx].email,
        phone: req.body.phone !== undefined ? req.body.phone : db.opportunities[oppIdx].phone,
        dealValue: req.body.dealValue !== undefined ? Number(req.body.dealValue) : db.opportunities[oppIdx].dealValue,
        stage: req.body.stage !== undefined ? req.body.stage : db.opportunities[oppIdx].stage,
        stageId: req.body.stageId !== undefined ? req.body.stageId : db.opportunities[oppIdx].stageId,
        assignedSalesperson: req.body.assignedSalesperson !== undefined ? req.body.assignedSalesperson : db.opportunities[oppIdx].assignedSalesperson,
        assignedSalespersonId: req.body.assignedSalespersonId !== undefined ? req.body.assignedSalespersonId : db.opportunities[oppIdx].assignedSalespersonId,
      };

      if (leadId) {
        const lIdx = db.leads.findIndex(l => l.id === leadId);
        if (lIdx !== -1) {
          if (req.body.assignedSalesperson !== undefined) db.leads[lIdx].assignedUser = req.body.assignedSalesperson;
          if (req.body.assignedSalespersonId !== undefined) db.leads[lIdx].assignedUserId = req.body.assignedSalespersonId;
          if (req.body.stage !== undefined) db.leads[lIdx].status = req.body.stage;
          if (req.body.customerName !== undefined) db.leads[lIdx].contactName = req.body.customerName;
          if (req.body.company !== undefined) db.leads[lIdx].company = req.body.company;
          if (req.body.email !== undefined) db.leads[lIdx].email = req.body.email;
          if (req.body.phone !== undefined) db.leads[lIdx].phone = req.body.phone;
          if (req.body.dealValue !== undefined) db.leads[lIdx].dealValue = Number(req.body.dealValue);
        }
      }

      const custIdx = db.customers.findIndex(c => c.opportunityId === id);
      if (custIdx !== -1) {
        if (req.body.assignedSalesperson !== undefined) db.customers[custIdx].assignedSalesperson = req.body.assignedSalesperson;
        if (req.body.assignedSalespersonId !== undefined) db.customers[custIdx].assignedSalespersonId = req.body.assignedSalespersonId;
        if (req.body.customerName !== undefined) db.customers[custIdx].customerName = req.body.customerName;
        if (req.body.company !== undefined) db.customers[custIdx].company = req.body.company;
        if (req.body.email !== undefined) db.customers[custIdx].email = req.body.email;
        if (req.body.phone !== undefined) db.customers[custIdx].phone = req.body.phone;
        if (req.body.dealValue !== undefined) db.customers[custIdx].dealValue = Number(req.body.dealValue);
      }

      writeDB(db);
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

    const opp = await prisma.opportunity.findUnique({
      where: { id }
    });

    if (opp && opp.leadId) {
      await prisma.lead.delete({
        where: { id: opp.leadId }
      }).catch(err => console.warn("Associated lead deletion failed:", err.message));
    }

    await prisma.opportunity.delete({
      where: { id }
    });

    // Update db.json for mock/fallback compatibility
    const db = readDB();
    if (db.opportunities) {
      db.opportunities = db.opportunities.filter(o => o.id !== id);
    }
    if (opp && opp.leadId && db.leads) {
      db.leads = db.leads.filter(l => l.id !== opp.leadId);
    }
    writeDB(db);

    res.json({
      success: true,
      message: "Deleted Successfully"
    });
  } catch (err) {
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
        assignedSalespersonId: lead.assignedUserId || null,
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

    // Also update db.json to keep them synced
    const db = readDB();
    const leadIdx = db.leads.findIndex(l => l.id === lead.id);
    if (leadIdx !== -1) {
      db.leads[leadIdx].status = "Converted";
    }
    const newOpportunity = {
      id: opportunity.id,
      leadId: opportunity.leadId,
      customerName: opportunity.customerName,
      company: opportunity.company,
      email: opportunity.email,
      phone: opportunity.phone,
      dealValue: opportunity.dealValue,
      assignedSalesperson: opportunity.assignedSalesperson,
      assignedSalespersonId: opportunity.assignedSalespersonId,
      stage: opportunity.stage,
      stageId: opportunity.stageId || 'p_1',
      expectedClosing: opportunity.expectedClosing ? opportunity.expectedClosing.toISOString().split('T')[0] : null,
      priority: opportunity.priority,
      tags: opportunity.tags,
      createdDate: opportunity.createdAt ? opportunity.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };
    db.opportunities.push(newOpportunity);
    writeDB(db);

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

    // 1. Find the opportunities first to get their leadIds
    const opps = await prisma.opportunity.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        leadId: true,
      },
    });

    const leadIds = opps.map(o => o.leadId).filter(Boolean);

    // 2. Delete the associated leads in Prisma
    if (leadIds.length > 0) {
      await prisma.lead.deleteMany({
        where: {
          id: {
            in: leadIds,
          },
        },
      }).catch(err => console.warn("Prisma associated leads bulk delete failed:", err.message));
    }

    // 3. Delete the opportunities in Prisma
    await prisma.opportunity.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    // 4. Update db.json for mock/fallback compatibility
    const db = readDB();
    if (db.opportunities) {
      db.opportunities = db.opportunities.filter(o => !ids.includes(o.id));
    }
    if (db.leads && leadIds.length > 0) {
      db.leads = db.leads.filter(l => !leadIds.includes(l.id));
    }
    writeDB(db);

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
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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
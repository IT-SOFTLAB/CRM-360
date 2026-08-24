const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();



/*
==================================
GET ALL CUSTOMERS
==================================
*/

exports.getCustomers = async (req, res) => {
  try {
    const user = req.user;
    const userRole = (user.role || '').toUpperCase().replace(/[\s_]+/g, '_');

    let whereClause = { organizationId: req.organizationId };
    if (userRole === 'USER') {
      whereClause.assignedSalesperson = user.name;
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

    const customer = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.organizationId
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
        organizationId: req.organizationId,

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

    const existing = await prisma.customer.findFirst({
      where: { id, organizationId: req.organizationId }
    });
    if (!existing) return res.status(404).json({ message: "Customer not found" });

  await prisma.customer.updateMany({
  where: {
    id,
    organizationId: req.organizationId
  },
  data: req.body
});

const customer = await prisma.customer.findFirst({
  where: {
    id,
    organizationId: req.organizationId
  }
});
    // Sync associated Opportunity & Lead in PostgreSQL
    if (req.body.assignedSalesperson !== undefined || req.body.assignedSalespersonId !== undefined) {
      const oppId = customer.opportunityId;
      if (oppId) {
        // Update Opportunity
        const oppCheck = await prisma.opportunity.findFirst({ where: { id: oppId, organizationId: req.organizationId } });
        let updatedOpp = null;
        if (oppCheck) {
         await prisma.opportunity.updateMany({
  where: {
    id: oppId,
    organizationId: req.organizationId
  },
  data: {
    assignedSalesperson: req.body.assignedSalesperson,
    assignedSalespersonId: req.body.assignedSalespersonId
  }
});

updatedOpp = await prisma.opportunity.findFirst({
  where: {
    id: oppId,
    organizationId: req.organizationId
  }
});
        }

        // Update Lead
        if (updatedOpp && updatedOpp.leadId) {
          const leadCheck = await prisma.lead.findFirst({ where: { id: updatedOpp.leadId, organizationId: req.organizationId } });
          if (leadCheck) {
           await prisma.lead.updateMany({
  where: {
    id: updatedOpp.leadId,
    organizationId: req.organizationId
  },
  data: {
    assignedUser: req.body.assignedSalesperson,
    assignedUserId: req.body.assignedSalespersonId
  }
});
          }
        }
      }
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
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId }
    });
    if (!existing) return res.status(404).json({ message: "Customer not found" });

  await prisma.customer.deleteMany({
  where: {
    id: req.params.id,
    organizationId: req.organizationId
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
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/*
==================================
GET ALL CUSTOMERS
==================================
*/

exports.getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
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
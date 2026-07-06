const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();



exports.createQuotation = async (req, res) => {
  try {

    const {
      quotationNumber,
      opportunityId,
      customerId,
      customerName,
      company,
      email,
      phone,
      salesperson,
      quotationDate,
      expirationDate,
      paymentTerms,
      currency,
      notes,
      subtotal,
      tax,
      total,
      items
    } = req.body;

    const quotation = await prisma.quotation.create({

      data: {

        quotationNumber,
        opportunityId,
        customerId,
        customerName,
        company,
        email,
        phone,
        salesperson,
        quotationDate: new Date(quotationDate),
        expirationDate: new Date(expirationDate),
        paymentTerms,
        currency,
        notes,
        subtotal,
        tax,
        total,

        status: "Draft",

        items: {

          create: items.map(item => ({

            product: item.product,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            tax: Number(item.tax),
            discount: Number(item.discount),
            subtotal: Number(item.subtotal)

          }))

        }

      },

      include: {

        items: true

      }

    });

    res.status(201).json(quotation);

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      message: "Failed to create quotation"

    });

  }

};



exports.getAllQuotations = async (req, res) => {

  try {

    const quotations = await prisma.quotation.findMany({

      include: {

        items: true

      },

      orderBy: {

        createdAt: "desc"

      }

    });

    res.json(quotations);

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      message: "Error"

    });

  }

};


exports.getQuotation = async (req, res) => {

  try {

    const quotation = await prisma.quotation.findUnique({

      where: {

        id: req.params.id

      },

      include: {

        items: true

      }

    });

    res.json(quotation);

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      message: "Error"

    });

  }

};


exports.updateQuotation = async (req, res) => {
  try {
    const {
     customerName,

company,

opportunityId,

email,

phone,

salesperson,

quotationDate,

expirationDate,

paymentTerms,

currency,

subtotal,

tax,

total,

notes,

items,
    } = req.body;

    const updatedQuotation = await prisma.quotation.update({
      where:{
id:req.params.id
},

data:{

customerName,

company,

opportunityId,

email,

phone,

salesperson,

quotationDate:new Date(quotationDate),

expirationDate:new Date(expirationDate),

paymentTerms,

currency,

subtotal,

tax,

total,

notes

}
    });

    // Update quotation items
    if (items) {
      await prisma.quotationItem.deleteMany({
        where: {
          quotationId: req.params.id,
        },
      });

      await prisma.quotationItem.createMany({
        data: items.map((item) => ({
          quotationId: req.params.id,
          product: item.product || "",
          description: item.description,
          quantity: Number(item.quantity || item.qty),
          unitPrice: Number(item.unitPrice || item.price),
          tax: Number(item.tax || 0),
          discount: Number(item.discount || 0),
          subtotal:
            Number(item.quantity || item.qty) *
            Number(item.unitPrice || item.price),
        })),
      });
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        items: true,
      },
    });

    res.json(quotation);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Update Failed",
    });
  }
};

exports.deleteQuotation = async (req, res) => {

  try {

    await prisma.quotation.delete({

      where: {

        id: req.params.id

      }

    });

    res.json({

      message: "Deleted"

    });

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      message: "Delete Failed"

    });

  }

};



exports.changeQuotationStatus = async (req, res) => {

  try {

    const quotation = await prisma.quotation.update({

      where: {

        id: req.params.id

      },

      data: {

        status: req.body.status

      }

    });

    res.json(quotation);

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      message: "Status Update Failed"

    });

  }

};

// ============================
// Get Opportunity Quotations
// ============================

exports.getOpportunityQuotations = async (req, res) => {

  try {

    const quotations = await prisma.quotation.findMany({

      where: {

        opportunityId: req.params.id

      },

      include: {

        items: true

      }

    });

    res.json(quotations);

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      message: "Error"

    });

  }

};
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();



exports.createQuotation = async (req, res) => {
  try {
    const {
      quotationNumber,
      opportunityId,
      customerId,
      customerNameSnapshot,
      customerCompanyNameSnapshot,
      customerEmailSnapshot,
      customerPhoneSnapshot,
      salesperson,
      quotationDate,
      expirationDate,
      paymentTerms,
      currency,
      notes,
      subtotal,
      tax,
      total,
      items,
      customerGstinSnapshot,
      billingAddressSnapshot,
      shippingAddressSnapshot,
      discountPercent,
      cgst,
      sgst,
      igst,
      shippingCharge,
      otherCharges,
      roundOff,
      termsConditions,
      internalNotes
    } = req.body;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        opportunityId,
        customerId,
        customerNameSnapshot,
        customerCompanyNameSnapshot,
        customerEmailSnapshot,
        customerPhoneSnapshot,
        salesperson,
        quotationDate: new Date(quotationDate),
        expirationDate: new Date(expirationDate),
        paymentTerms,
        currency,
        notes,
        subtotal: Number(subtotal || 0),
        tax: Number(tax || 0),
        total: Number(total || 0),
        status: "Draft",
        customerGstinSnapshot,
        billingAddressSnapshot,
        shippingAddressSnapshot,
        discountPercent: Number(discountPercent || 0),
        cgst: Number(cgst || 0),
        sgst: Number(sgst || 0),
        igst: Number(igst || 0),
        shippingCharge: Number(shippingCharge || 0),
        otherCharges: Number(otherCharges || 0),
        roundOff: Number(roundOff || 0),
        termsConditions,
        internalNotes,
        items: {
          create: (items || []).map(item => ({
            product: item.product,
            description: item.description,
            quantity: Number(item.quantity || item.qty || 1),
            unitPrice: Number(item.unitPrice || item.price || 0),
            tax: Number(item.tax || 0),
            discount: Number(item.discount || 0),
            subtotal: Number(item.subtotal || 0)
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json(quotation);
  } catch (err) {
    console.error("Create Quotation Error:", err);
    res.status(500).json({
      message: "Failed to create quotation",
      error: err.message
    });
  }
};



exports.getAllQuotations = async (req, res) => {

  try {
    const user = req.user;
    const userRole = (user.role || '').toUpperCase().replace(/[\s_]+/g, '_');

    let whereClause = {};
    if (userRole === 'USER') {
      whereClause = { salesperson: user.name };
    }

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
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
      customerNameSnapshot,
      customerCompanyNameSnapshot,
      opportunityId,
      customerEmailSnapshot,
      customerPhoneSnapshot,
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
      customerGstinSnapshot,
      billingAddressSnapshot,
      shippingAddressSnapshot,
      discountPercent,
      cgst,
      sgst,
      igst,
      shippingCharge,
      otherCharges,
      roundOff,
      termsConditions,
      internalNotes
    } = req.body;

    const updatedQuotation = await prisma.quotation.update({
      where: {
        id: req.params.id
      },
      data: {
        customerNameSnapshot,
        customerCompanyNameSnapshot,
        opportunityId,
        customerEmailSnapshot,
        customerPhoneSnapshot,
        salesperson,
        quotationDate: new Date(quotationDate),
        expirationDate: new Date(expirationDate),
        paymentTerms,
        currency,
        subtotal: Number(subtotal || 0),
        tax: Number(tax || 0),
        total: Number(total || 0),
        notes,
        customerGstinSnapshot,
        billingAddressSnapshot,
        shippingAddressSnapshot,
        discountPercent: Number(discountPercent || 0),
        cgst: Number(cgst || 0),
        sgst: Number(sgst || 0),
        igst: Number(igst || 0),
        shippingCharge: Number(shippingCharge || 0),
        otherCharges: Number(otherCharges || 0),
        roundOff: Number(roundOff || 0),
        termsConditions,
        internalNotes
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
          description: item.description || "",
          quantity: Number(item.quantity || item.qty || 1),
          unitPrice: Number(item.unitPrice || item.price || 0),
          tax: Number(item.tax || 0),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal || 0)
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
    console.error("Update Quotation Error:", err);
    res.status(500).json({
      message: "Update Failed",
      error: err.message
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
const { PrismaClient } = require("@prisma/client");
const { getGraphClient } = require("../services/graphService");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");
const { generateQuotationPDF } = require("../services/pdfService");

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



exports.sendQuotationByOutlook = async (req, res) => {
  try {

    if (!req.session?.outlook?.accessToken) {
      return res.status(401).json({
        success: false,
        message: "Outlook is not connected."
      });
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        items: true
      }
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

  const client = getGraphClient(
    req.session.outlook.accessToken
);

const attachments = [];
const pdfPath = await generateQuotationPDF(quotation);

const file = fs.readFileSync(pdfPath);

attachments.push({
  "@odata.type": "#microsoft.graph.fileAttachment",
  name: `Quotation-${quotation.quotationNumber}.pdf`,
  contentBytes: file.toString("base64"),
});
const html = `
<div style="font-family:Arial,sans-serif;font-size:15px;color:#333">

<h2 style="color:#2563eb">
Quotation ${quotation.quotationNumber}
</h2>

<p>Dear ${quotation.customerNameSnapshot},</p>

<p>
Thank you for your interest in our services.
Please find the quotation attached with this email.
</p>

<table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse">

<tr>
<td><b>Quotation Number</b></td>
<td>${quotation.quotationNumber}</td>
</tr>

<tr>
<td><b>Total Amount</b></td>
<td>${quotation.currency} ${quotation.total}</td>
</tr>

<tr>
<td><b>Valid Till</b></td>
<td>${quotation.expirationDate.toDateString()}</td>
</tr>

</table>

<br>

<p>
If you have any questions, simply reply to this email.
</p>

<br>

<p>
Regards,<br>
CRM 360 Team
</p>

</div>
`;

  await client.api("/me/sendMail").post({
  message: {
    subject: `Quotation ${quotation.quotationNumber}`,

    body: {
      contentType: "HTML",
      content: html,
    },

    toRecipients: [
      {
        emailAddress: {
          address: quotation.customerEmailSnapshot,
        },
      },
    ],

    attachments,
  },

  saveToSentItems: true,
});
if (fs.existsSync(pdfPath)) {
  fs.unlinkSync(pdfPath);
}

    await prisma.quotation.update({
      where: {
        id: quotation.id
      },
      data: {
        status: "Sent"
      }
    });

    res.json({
      success: true,
      message: "Quotation sent successfully."
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};


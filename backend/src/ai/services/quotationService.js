const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class QuotationService {


    async generateQuotationNumber() {

        const latest = await prisma.quotation.findFirst({

            orderBy: {

                createdAt: "desc"

            }

        });

        if (!latest) {

            return "QT-000001";

        }

        const current = parseInt(

            latest.quotationNumber.replace("QT-", ""),

            10

        );

        return `QT-${String(current + 1).padStart(6, "0")}`;

    }
    //----------------------------------------
    // Create Quotation
    //----------------------------------------

    async create(user, params) {

     const leadName =

    params.lead ||

    params.client ||

    params.customer;


    const opportunity = await prisma.opportunity.findFirst({

    where: {

        customerName: {

            contains: leadName,

            mode: "insensitive"

        }

    }

});

if (!opportunity) {

    return {

        success: false,

        message: "Opportunity not found."

    };

}

const customer = await prisma.customer.findFirst({

    where: {

        opportunityId: opportunity.id

    }

});

const quotationNumber =

    await this.generateQuotationNumber();

    
  

    const quotation = await prisma.quotation.create({

    data: {

        quotationNumber,

        opportunityId: opportunity.id,

    customerId: customer ? customer.id : null,

       customerNameSnapshot: opportunity.customerName,

customerCompanyNameSnapshot: opportunity.company || "",

customerEmailSnapshot: opportunity.email || "",

customerPhoneSnapshot: opportunity.phone || "",

salesperson: opportunity.assignedSalesperson || "",

        quotationDate: new Date(),

        expirationDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ),

        paymentTerms: "Net 30",

        currency: "INR",

        subtotal: 0,

        tax: 0,

        total: 0,

        status: "Draft",

        // Fields missing in Customer model
        customerGstinSnapshot: null,

        billingAddressSnapshot: null,

        shippingAddressSnapshot: null

    }

});
      

        return {

            success: true,

            message: "Quotation created successfully.",

            data: quotation

        };

    }

}

module.exports = new QuotationService();
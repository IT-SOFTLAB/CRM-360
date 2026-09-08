const { PrismaClient } = require("@prisma/client");
const AuthorizationService =
    require("./authorization.service");

const prisma = new PrismaClient();

class QuotationService {

    //----------------------------------------
    // Generate Quotation Number
    //----------------------------------------

    async generateQuotationNumber(organizationId) {

        const latest =
            await prisma.quotation.findFirst({

                where: {
                    organizationId
                },

                orderBy: {
                    createdAt: "desc"
                }

            });

        if (!latest) {

            return "QT-000001";

        }

        const current = parseInt(
            latest.quotationNumber.replace(
                "QT-",
                ""
            ),
            10
        );

        return `QT-${String(
            current + 1
        ).padStart(6, "0")}`;

    }


    //----------------------------------------
    // Create Quotation
    //----------------------------------------

    async create(user, params) {

        //------------------------------------
        // Organization validation
        //------------------------------------

        if (!user?.organizationId) {

            return {
                success: false,
                message:
                    "Organization access is required."
            };

        }

        const organizationId =
            user.organizationId;


        //------------------------------------
        // Resolve customer / lead name
        //------------------------------------

        const leadName =
            params.lead ||
            params.client ||
            params.customer;

        if (!leadName) {

            return {
                success: false,
                message:
                    "Lead or customer name is required."
            };

        }


        //------------------------------------
        // Find Opportunity
        //------------------------------------

        const opportunityWhere = {

            customerName: {

                contains: leadName,

                mode: "insensitive"

            },

            ...AuthorizationService.opportunityFilter(
                user
            )

        };

        const opportunity =
            await prisma.opportunity.findFirst({

                where: opportunityWhere

            });

        if (!opportunity) {

            return {

                success: false,

                message:
                    "Opportunity not found or you do not have access."

            };

        }


        //------------------------------------
        // Find Customer
        //------------------------------------

        const customerWhere = {

            opportunityId:
                opportunity.id,

            ...AuthorizationService.customerFilter(
                user
            )

        };

        const customer =
            await prisma.customer.findFirst({

                where: customerWhere

            });


        //------------------------------------
        // Generate quotation number
        //------------------------------------

        const quotationNumber =
            await this.generateQuotationNumber(
                organizationId
            );


        //------------------------------------
        // Create quotation
        //------------------------------------

        const quotation =
            await prisma.quotation.create({

                data: {

                    //--------------------------------
                    // Organization
                    //--------------------------------

                    organizationId,


                    //--------------------------------
                    // References
                    //--------------------------------

                    quotationNumber,

                    opportunityId:
                        opportunity.id,

                    customerId:
                        customer
                            ? customer.id
                            : null,


                    //--------------------------------
                    // Customer snapshots
                    //--------------------------------

                    customerNameSnapshot:
                        opportunity.customerName,

                    customerCompanyNameSnapshot:
                        opportunity.company || "",

                    customerEmailSnapshot:
                        opportunity.email || "",

                    customerPhoneSnapshot:
                        opportunity.phone || "",


                    //--------------------------------
                    // Salesperson
                    //--------------------------------

                    salesperson:
                        opportunity.assignedSalesperson ||
                        "",


                    //--------------------------------
                    // Dates
                    //--------------------------------

                    quotationDate:
                        new Date(),

                    expirationDate:
                        new Date(
                            Date.now() +
                            30 *
                            24 *
                            60 *
                            60 *
                            1000
                        ),


                    //--------------------------------
                    // Financials
                    //--------------------------------

                    paymentTerms:
                        "Net 30",

                    currency:
                        "INR",

                    subtotal: 0,

                    tax: 0,

                    total: 0,

                    status:
                        "Draft",


                    //--------------------------------
                    // Optional snapshots
                    //--------------------------------

                    customerGstinSnapshot:
                        null,

                    billingAddressSnapshot:
                        null,

                    shippingAddressSnapshot:
                        null

                }

            });


        //------------------------------------
        // Response
        //------------------------------------

        return {

            success: true,

            message:
                "Quotation created successfully.",

            data:
                quotation

        };

    }

}

module.exports =
    new QuotationService();
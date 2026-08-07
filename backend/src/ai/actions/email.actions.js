const EmailService = require("../services/emailService");
const { getOutlookTokens } = require("../../services/graphService");
const prisma = require("../../config/prisma");
const EmailGenerator = require("../services/emailGenerator.service");
const EmailReader =
require("../services/emailReader.service");
module.exports = {

    async unread(req) {

    const outlook =
        await getOutlookTokens(req);

    if (!outlook?.accessToken) {

        return {

            success: false,

            requiresOutlook: true,

            message: "Please connect Outlook."

        };

    }

    const emails =
        await EmailReader.unread(

            outlook.accessToken

        );

    return {

        success: true,

        emails

    };

},

    //----------------------------------------------------
    // Draft Email
    //----------------------------------------------------

 async draft(params, req) {

    const {

        to,
        lead,
        template

    } = params;

    let recipient = to;

    //----------------------------------------
    // Find Lead Email
    //----------------------------------------

    if (!recipient && lead) {

        const leadData = await prisma.lead.findFirst({

            where: {

                contactName: {

                    equals: lead,

                    mode: "insensitive"

                }

            }

        });

        if (!leadData) {

            return {

                success: false,

                message: "Lead not found."

            };

        }

        recipient = leadData.email;

    }

    //----------------------------------------
    // Generate AI Email
    //----------------------------------------

    const generatedEmail =
        await EmailGenerator.generate({

            template,

            lead

        });

    //----------------------------------------
    // Outlook Token
    //----------------------------------------

    const outlook = await getOutlookTokens(req);

    if (!outlook?.accessToken) {

        return {

            success: false,

            message: "Outlook is not connected."

        };

    }

    //----------------------------------------
    // Create Outlook Draft
    //----------------------------------------

    return await EmailService.createDraft(

        outlook.accessToken,

        {

            to: recipient,

            subject: generatedEmail.subject,

            body: generatedEmail.body

        }

    );

},
    //----------------------------------------------------
    // Send Email
    //----------------------------------------------------

    async send(params, req) {

        const {

            to,
            subject,
            body,
            lead

        } = params;

        let recipient = to;

        //----------------------------------------
        // Find Lead Email
        //----------------------------------------

        if (!recipient && lead) {

            const leadData = await prisma.lead.findFirst({

                where: {

                    contactName: {

                        equals: lead,

                        mode: "insensitive"

                    }

                }

            });

            if (!leadData) {

                return {

                    success: false,

                    message: "Lead not found."

                };

            }

            recipient = leadData.email;

        }

        //----------------------------------------
        // Outlook Token
        //----------------------------------------

        const outlook = await getOutlookTokens(req);

        if (!outlook?.accessToken) {

            return {

                success: false,

                message: "Outlook is not connected."

            };

            

        }

        return await EmailService.send(

            outlook.accessToken,

            {

                to: recipient,

                subject,

                body

            }

        );

    }


    
};
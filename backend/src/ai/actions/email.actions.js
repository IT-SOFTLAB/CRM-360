const EmailService = require("../services/emailService");
const { getOutlookTokens } = require("../../services/graphService");
const prisma = require("../../config/prisma");
const EmailGenerator = require("../services/emailGenerator.service");
const EmailReader = require("../services/emailReader.service");
const AuthorizationService = require("../services/authorization.service");

module.exports = {

    //----------------------------------------------------
    // Unread Emails
    //----------------------------------------------------

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

        let message = "";

        if (emails && emails.length > 0) {

            message =
                `You have ${emails.length} unread email(s):\n\n` +

                emails.map(e => {

                    const sender =
                        e.from?.emailAddress?.name ||
                        e.from?.emailAddress?.address ||
                        "Unknown Sender";

                    const date =
                        new Date(
                            e.receivedDateTime
                        ).toLocaleString();

                    return `From: ${sender}
Subject: ${e.subject || "(No Subject)"}
Preview: ${e.bodyPreview || "(No body preview)"}
Received: ${date}`;

                }).join("\n\n---\n\n");

        } else {

            message =
                "You have no unread emails.";

        }

        return {

            success: true,

            message,

            emails

        };

    },


    //----------------------------------------------------
    // Draft Email
    //----------------------------------------------------

    async draft(params, req) {

        if (!req?.user?.organizationId) {

            return {
                success: false,
                message:
                    "Organization access is required."
            };

        }

        const organizationId =
            req.user.organizationId;

        const {
            to,
            lead,
            template
        } = params;

        let recipient = to;
        let targetLead = null;

        //----------------------------------------
        // Find Lead by Name
        //----------------------------------------

        if (lead) {

            const leadWhere = {

                contactName: {
                    equals: lead,
                    mode: "insensitive"
                },

                organizationId

            };

            Object.assign(
                leadWhere,
                AuthorizationService.leadFilter(
                    req.user
                )
            );

            targetLead =
                await prisma.lead.findFirst({

                    where: leadWhere

                });

            if (!targetLead) {

                return {

                    success: false,

                    message:
                        `Lead '${lead}' not found or you do not have access.`

                };

            }

            recipient = targetLead.email;

        }

        //----------------------------------------
        // Find Lead by Email
        //----------------------------------------

        else if (recipient) {

            const emailWhere = {

                email: {
                    equals: recipient,
                    mode: "insensitive"
                },

                organizationId

            };

            Object.assign(
                emailWhere,
                AuthorizationService.leadFilter(
                    req.user
                )
            );

            targetLead =
                await prisma.lead.findFirst({

                    where: emailWhere

                });

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

        const outlook =
            await getOutlookTokens(req);

        if (!outlook?.accessToken) {

            return {

                success: false,

                message:
                    "Outlook is not connected."

            };

        }

        //----------------------------------------
        // Create Outlook Draft
        //----------------------------------------

        return await EmailService.createDraft(

            outlook.accessToken,

            {

                to: recipient,

                subject:
                    generatedEmail.subject,

                body:
                    generatedEmail.body

            }

        );

    },


    //----------------------------------------------------
    // Send Email
    //----------------------------------------------------

    async send(params, req) {

        if (!req?.user?.organizationId) {

            return {
                success: false,
                message:
                    "Organization access is required."
            };

        }

        const organizationId =
            req.user.organizationId;

        const {

            to,
            subject,
            body,
            lead

        } = params;

        let recipient = to;
        let targetLead = null;

        //----------------------------------------
        // Find Lead by Name
        //----------------------------------------

        if (lead) {

            const leadWhere = {

                contactName: {

                    equals: lead,

                    mode: "insensitive"

                },

                organizationId

            };

            Object.assign(

                leadWhere,

                AuthorizationService.leadFilter(
                    req.user
                )

            );

            targetLead =
                await prisma.lead.findFirst({

                    where: leadWhere

                });

            if (!targetLead) {

                return {

                    success: false,

                    message:
                        `Lead '${lead}' not found or you do not have access.`

                };

            }

            recipient =
                targetLead.email;

        }

        //----------------------------------------
        // Find Lead by Email
        //----------------------------------------

        else if (recipient) {

            const emailWhere = {

                email: {

                    equals: recipient,

                    mode: "insensitive"

                },

                organizationId

            };

            Object.assign(

                emailWhere,

                AuthorizationService.leadFilter(
                    req.user
                )

            );

            targetLead =
                await prisma.lead.findFirst({

                    where: emailWhere

                });

        }

        //----------------------------------------
        // Validate Recipient
        //----------------------------------------

        if (!recipient) {

            return {

                success: false,

                message:
                    "Recipient email is required."

            };

        }

        //----------------------------------------
        // Outlook Token
        //----------------------------------------

        const outlook =
            await getOutlookTokens(req);

        if (!outlook?.accessToken) {

            return {

                success: false,

                message:
                    "Outlook is not connected."

            };

        }

        //----------------------------------------
        // Send Email
        //----------------------------------------

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
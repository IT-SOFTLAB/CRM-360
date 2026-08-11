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

    let message = "";
    if (emails && emails.length > 0) {
        message = `You have ${emails.length} unread email(s):\n\n` + emails.map(e => {
            const sender = e.from?.emailAddress?.name || e.from?.emailAddress?.address || "Unknown Sender";
            const date = new Date(e.receivedDateTime).toLocaleString();
            return `From: ${sender}\nSubject: ${e.subject || "(No Subject)"}\nPreview: ${e.bodyPreview || "(No body preview)"}\nReceived: ${date}`;
        }).join('\n\n---\n\n');
    } else {
        message = "You have no unread emails.";
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

    const {

        to,
        lead,
        template

    } = params;

    let recipient = to;
    let targetLead = null;

    //----------------------------------------
    // Find Lead Email
    //----------------------------------------

    if (lead) {

        targetLead = await prisma.lead.findFirst({

            where: {

                contactName: {

                    equals: lead,

                    mode: "insensitive"

                }

            }

        });

        if (!targetLead) {

            return {

                success: false,

                message: `Lead '${lead}' not found.`

            };

        }

        recipient = targetLead.email;

    } else if (recipient) {

        targetLead = await prisma.lead.findFirst({

            where: {

                email: {

                    equals: recipient,

                    mode: "insensitive"

                }

            }

        });

    }

    //----------------------------------------
    // Authorization check
    //----------------------------------------

    if (req && req.user) {

        const userRole = (req.user.role || '').toUpperCase().replace(/[\s_]+/g, '_');

        if (userRole === 'USER') {

            if (targetLead) {

                const isAssigned = targetLead.assignedUserId === req.user.id || 

                                   (targetLead.assignedUser && targetLead.assignedUser.toLowerCase() === req.user.name.toLowerCase());

                if (!isAssigned) {

                    return {

                        success: false,

                        message: "Authorization failed: You are not authorized to email this lead (it is assigned to another salesperson)."

                    };

                }

            } else if (recipient) {

                const registeredLead = await prisma.lead.findFirst({

                    where: {

                        email: {

                            equals: recipient,

                            mode: "insensitive"

                        }

                    }

                });

                if (registeredLead) {

                    const isAssigned = registeredLead.assignedUserId === req.user.id || 

                                       (registeredLead.assignedUser && registeredLead.assignedUser.toLowerCase() === req.user.name.toLowerCase());

                    if (!isAssigned) {

                        return {

                            success: false,

                            message: "Authorization failed: You are not authorized to email this lead (it is assigned to another salesperson)."

                        };

                    }

                }

            }

        }

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
        let targetLead = null;

        //----------------------------------------
        // Find Lead Email
        //----------------------------------------

        if (lead) {

            targetLead = await prisma.lead.findFirst({

                where: {

                    contactName: {

                        equals: lead,

                        mode: "insensitive"

                    }

                }

            });

            if (!targetLead) {

                return {

                    success: false,

                    message: `Lead '${lead}' not found.`

                };

            }

            recipient = targetLead.email;

        } else if (recipient) {

            targetLead = await prisma.lead.findFirst({

                where: {

                    email: {

                        equals: recipient,

                        mode: "insensitive"

                    }

                }

            });

        }

        //----------------------------------------
        // Authorization check
        //----------------------------------------

        if (req && req.user) {

            const userRole = (req.user.role || '').toUpperCase().replace(/[\s_]+/g, '_');

            if (userRole === 'USER') {

                if (targetLead) {

                    const isAssigned = targetLead.assignedUserId === req.user.id || 

                                       (targetLead.assignedUser && targetLead.assignedUser.toLowerCase() === req.user.name.toLowerCase());

                    if (!isAssigned) {

                        return {

                            success: false,

                            message: "Authorization failed: You are not authorized to email this lead (it is assigned to another salesperson)."

                        };

                    }

                } else if (recipient) {

                    const registeredLead = await prisma.lead.findFirst({

                        where: {

                            email: {

                                equals: recipient,

                                mode: "insensitive"

                            }

                        }

                    });

                    if (registeredLead) {

                        const isAssigned = registeredLead.assignedUserId === req.user.id || 

                                           (registeredLead.assignedUser && registeredLead.assignedUser.toLowerCase() === req.user.name.toLowerCase());

                        if (!isAssigned) {

                            return {

                                success: false,

                                message: "Authorization failed: You are not authorized to email this lead (it is assigned to another salesperson)."

                            };

                        }

                    }

                }

            }

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
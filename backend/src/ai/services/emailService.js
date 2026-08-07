const { getGraphClient } = require("../../services/graphService");

class EmailService {

    //---------------------------------------
    // Draft Email
    //---------------------------------------

    async draft({ subject, body }) {

        return {

            success: true,

            draft: {

                subject,

                body

            }

        };

    }

    //---------------------------------------
    // Send Email
    //---------------------------------------

    async send(accessToken, email) {

        const client =
            getGraphClient(accessToken);

        await client

            .api("/me/sendMail")

            .post({

                message: {

                    subject: email.subject,

                    body: {

                        contentType: "HTML",

                        content: email.body

                    },

                    toRecipients: [

                        {

                            emailAddress: {

                                address: email.to

                            }

                        }

                    ]

                }

            });

        return {

            success: true,

            message: "Email sent successfully."

        };

    }

}

module.exports =
    new EmailService();
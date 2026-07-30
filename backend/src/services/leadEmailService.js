const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getOutlookTokens, getGraphClient } = require("./graphService");
const mailService = require("./mailService");

/**
 * Sends an email notification to a salesperson when leads are assigned to them.
 * Attempts to send via the admin's Outlook account if connected, otherwise falls back to system SMTP.
 * 
 * @param {Object} req - Express request object (used to retrieve logged-in admin's Outlook tokens)
 * @param {String} assignedUserId - ID of the salesperson the leads are assigned to
 * @param {Array} leads - Array of leads (containing contactName, company, email)
 */
async function sendLeadAssignmentEmail(req, assignedUserId, leads) {
  try {
    if (!assignedUserId || !leads || leads.length === 0) {
      console.log("sendLeadAssignmentEmail: Missing assignedUserId or leads list.");
      return;
    }

    // Fetch salesperson details
    const salesperson = await prisma.user.findUnique({
      where: { id: assignedUserId }
    });

    if (!salesperson || !salesperson.email) {
      console.log(`sendLeadAssignmentEmail: Salesperson not found or has no email for ID: ${assignedUserId}`);
      return;
    }

    const isMultiple = leads.length > 1;
    const subject = isMultiple
      ? `[CRM360] New Leads Assigned to You`
      : `[CRM360] New Lead Assigned to You: ${leads[0].contactName || 'N/A'}`;

    // Build the email body HTML
    let emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1a202c;">
        <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #2b6cb0; margin: 0; font-size: 24px;">New Lead Assignment</h2>
          <p style="color: #4a5568; margin: 5px 0 0 0; font-size: 14px;">CRM 360 Notifications</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5;">Hello <strong>${salesperson.name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5; color: #4a5568;">
          The following lead${isMultiple ? 's have' : ' has'} been assigned to you. Here are the key details:
        </p>
        
        <div style="overflow-x: auto; margin-top: 20px; margin-bottom: 20px;">
          <table border="1" cellpadding="10" style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 15px;">
            <thead>
              <tr style="background-color: #f7fafc; border-bottom: 2px solid #cbd5e0; text-align: left;">
                <th style="padding: 10px; border: 1px solid #e2e8f0; color: #4a5568;">Contact Name</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; color: #4a5568;">Company Name</th>
                <th style="padding: 10px; border: 1px solid #e2e8f0; color: #4a5568;">Email Address</th>
              </tr>
            </thead>
            <tbody>
    `;

    leads.forEach(lead => {
      emailHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 500;">${lead.contactName || 'N/A'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">${lead.company || 'N/A'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; color: #2b6cb0;">
            ${lead.email ? `<a href="mailto:${lead.email}" style="color: #2b6cb0; text-decoration: none;">${lead.email}</a>` : 'N/A'}
          </td>
        </tr>
      `;
    });

    emailHtml += `
            </tbody>
          </table>
        </div>
        
        <p style="font-size: 15px; line-height: 1.5; color: #4a5568; margin-top: 25px;">
          Please log in to the CRM portal to view the full details and start follow-up activities.
        </p>
        
        <div style="margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #a0aec0; text-align: center;">
          This is an automated notification sent from CRM 360.
        </div>
      </div>
    `;

    // 1. Try to send via the admin's Outlook account (if connected)
    let emailSent = false;
    let outlookTokens = null;
    try {
      outlookTokens = await getOutlookTokens(req);
    } catch (tokenErr) {
      console.warn("sendLeadAssignmentEmail: Could not retrieve Outlook tokens:", tokenErr.message);
    }

    if (outlookTokens?.accessToken) {
      try {
        console.log(`sendLeadAssignmentEmail: Sending via admin Outlook (${outlookTokens.email}) to ${salesperson.email}...`);
        const client = getGraphClient(outlookTokens.accessToken);
        await client.api("/me/sendMail").post({
          message: {
            subject: subject,
            body: {
              contentType: "HTML",
              content: emailHtml
            },
            toRecipients: [
              {
                emailAddress: {
                  address: salesperson.email
                }
              }
            ]
          }
        });
        console.log("sendLeadAssignmentEmail: Email successfully sent via Microsoft Graph (Outlook).");
        emailSent = true;
      } catch (graphErr) {
        console.error("sendLeadAssignmentEmail: Failed to send via Outlook Graph API. Error:", graphErr.message);
      }
    }

    // 2. Fallback to system mail service (SMTP / Resend) if Outlook is not connected or failed
    if (!emailSent) {
      console.log("sendLeadAssignmentEmail: Outlook not connected or Graph send failed. Falling back to system SMTP / Resend...");
      try {
        const fallbackSubject = `[System Fallback] ${subject}`;
        await mailService.sendMail({
          to: salesperson.email,
          subject: fallbackSubject,
          html: emailHtml
        });
        console.log("sendLeadAssignmentEmail: Email successfully sent via system email fallback.");
        emailSent = true;
      } catch (smtpErr) {
        console.error("sendLeadAssignmentEmail: Failed to send via system fallback. Error:", smtpErr.message);
      }
    }

  } catch (err) {
    console.error("sendLeadAssignmentEmail: Global error in helper function:", err);
  }
}

module.exports = {
  sendLeadAssignmentEmail
};

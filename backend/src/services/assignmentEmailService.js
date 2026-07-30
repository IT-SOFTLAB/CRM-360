const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const {
    getOutlookTokensByUserId,
    getGraphClient,
} = require("./graphService");

async function sendAssignmentEmail({
    userId,
    assignedSalespersonId,
    opportunityIds,
}) {
    console.log("========== ASSIGNMENT EMAIL START ==========");

    console.log("Admin User:", userId);
    console.log("Salesperson:", assignedSalespersonId);
    console.log("Opportunity IDs:", opportunityIds);

    // STEP 1
    console.log("Fetching Outlook token...");
    const outlook = await getOutlookTokensByUserId(userId);

    console.log("Outlook:", outlook);

    if (!outlook?.accessToken) {
        throw new Error("Admin Outlook is not connected.");
    }

    // STEP 2
    console.log("Creating Graph client...");
    const client = getGraphClient(outlook.accessToken);

    // STEP 3
    console.log("Fetching salesperson...");

    const salesperson = await prisma.user.findUnique({
        where: {
            id: assignedSalespersonId,
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });

    console.log("Salesperson:", salesperson);

    if (!salesperson) {
        throw new Error("Salesperson not found");
    }

    if (!salesperson.email) {
        throw new Error("Salesperson email missing");
    }

    // STEP 4
    console.log("Fetching opportunities...");

    const opportunities = await prisma.opportunity.findMany({
        where: {
            id: {
                in: opportunityIds,
            },
        },
        select: {
            customerName: true,
            company: true,
            email: true,
        },
    });

    console.log("Total Opportunities:", opportunities.length);

    if (opportunities.length === 0) {
        console.log("No opportunities found.");
        return;
    }

    const rows = opportunities
        .map(
            (opp, index) => `
<tr>
<td>${index + 1}</td>
<td>${opp.customerName ?? "-"}</td>
<td>${opp.company ?? "-"}</td>
<td>${opp.email ?? "-"}</td>
</tr>`
        )
        .join("");

    const html = `
<h2>New Opportunities Assigned</h2>

<p>Hello <strong>${salesperson.name}</strong>,</p>

<p>You have been assigned ${opportunities.length} opportunities.</p>

<table border="1" cellpadding="8" cellspacing="0">
<tbody>
${rows}
</tbody>
</table>
`;

    try {

        console.log("Checking Graph account...");

        const me = await client.api("/me").get();

        console.log("Logged in as:", me.mail || me.userPrincipalName);

        console.log("Sending email to:", salesperson.email);

        await client.api("/me/sendMail").post({
            message: {
                subject: "CRM 360 Assignment",
                body: {
                    contentType: "HTML",
                    content: html,
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: salesperson.email.trim(),
                        },
                    },
                ],
            },
            saveToSentItems: true,
        });

        console.log("MAIL SENT SUCCESSFULLY");

    } catch (err) {

        console.error("GRAPH ERROR");
        console.error(err);

        if (err.body) {
            console.error(err.body);
        }

        throw err;
    }

    console.log("========== ASSIGNMENT EMAIL END ==========");
}

module.exports = {
    sendAssignmentEmail,
};
const {
    getGraphClient
}=require("../services/graphService");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, '../../db.json');

function readJSONDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading JSON DB:", e);
  }
  return {};
}

function writeJSONDB(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error writing JSON DB:", e);
  }
}

const logOutgoingEmail = async (logData) => {
  try {
    // 1. Save to Prisma
    await prisma.emailLog.create({
      data: {
        recipientEmail: logData.recipientEmail,
        subject: logData.subject,
        leadId: logData.leadId || null,
        opportunityId: logData.opportunityId || null,
        sentByUserId: logData.sentByUserId,
        status: logData.status,
        errorMessage: logData.errorMessage || null,
        attachments: logData.attachments || null,
        emailBody: logData.emailBody,
        sentAt: new Date()
      }
    });
  } catch (err) {
    console.error("Failed to save email log to Prisma:", err);
  }

  // 2. Save to db.json
  try {
    const db = readJSONDB();
    if (!db.emailLogs) {
      db.emailLogs = [];
    }
    db.emailLogs.push({
      id: 'elog_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      recipientEmail: logData.recipientEmail,
      subject: logData.subject,
      leadId: logData.leadId || null,
      opportunityId: logData.opportunityId || null,
      sentByUserId: logData.sentByUserId,
      status: logData.status,
      errorMessage: logData.errorMessage || null,
      attachments: logData.attachments || null,
      emailBody: logData.emailBody,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    writeJSONDB(db);
  } catch (err) {
    console.error("Failed to save email log to db.json:", err);
  }
};

async function getFolderMessages(req, folderName) {
  if (!req.session?.outlook?.accessToken) {
    return [];
}
    const client = getGraphClient(req.session.outlook.accessToken)

    const mails = await client
        .api(`/me/mailFolders/${folderName}/messages`)
        .top(30)
        .orderby("receivedDateTime DESC")
        .get();

   const conversations = {};

mails.value.forEach((mail) => {

    const id = mail.conversationId;

    if (
        !conversations[id] ||
        new Date(mail.receivedDateTime) >
        new Date(conversations[id].date)
    ) {

        conversations[id] = {

            id: mail.id,

            conversationId: mail.conversationId,

            sender:
                mail.from?.emailAddress?.address || "",

            recipient: "",

            subject:
                mail.subject || "(No Subject)",

            body:
                mail.bodyPreview || "",

            folder: folderName,

            date:
                mail.receivedDateTime,

            read:
                mail.isRead

        };

    }

});

return Object.values(conversations);
}


exports.getInbox = async (req, res) => {
    try {
       const emails = await getFolderMessages(req, "Inbox");
        res.json(emails);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getSent = async (req, res) => {
    try {
      const emails = await getFolderMessages(req, "SentItems");
        res.json(emails);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getDrafts = async (req, res) => {
    try {
      const emails = await getFolderMessages(req, "Drafts");
        res.json(emails);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getTrash = async (req, res) => {
    try {
      const emails = await getFolderMessages(req, "DeletedItems");
        res.json(emails);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getFolders = async(req,res)=>{

    try{

        const client=getGraphClient(req.session.outlook.accessToken)

        const folders=await client

        .api("/me/mailFolders")

        .get();

        res.json(folders.value);

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};


exports.markRead = async (req, res) => {

    try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
        const client = getGraphClient(req.session.outlook.accessToken)

        await client
            .api(`/me/messages/${req.params.id}`)
            .patch({
                isRead: true
            });

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.sendMail = async (req, res) => {
  const recipientEmail = req.body.to;
  const subject = req.body.subject || "(No Subject)";
  const body = req.body.body || "";
  const attachments = req.body.attachments ? JSON.stringify(req.body.attachments) : null;
  const userId = req.user?.id || "System";

  // Validate email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(recipientEmail);

  // Dynamic Lead/Opportunity Lookup
  let leadId = req.body.leadId || null;
  let opportunityId = req.body.opportunityId || null;
  
  try {
    if (!leadId) {
      const leadObj = await prisma.lead.findFirst({
        where: { email: { equals: recipientEmail, mode: 'insensitive' } }
      });
      if (leadObj) leadId = leadObj.id;
    }
    if (!opportunityId) {
      const oppObj = await prisma.opportunity.findFirst({
        where: { email: { equals: recipientEmail, mode: 'insensitive' } }
      });
      if (oppObj) opportunityId = oppObj.id;
    }
  } catch (err) {
    console.error("Prisma error during lead/opp lookup:", err);
  }

  if (!isValidEmail) {
    // Log as Invalid
    const logData = {
      recipientEmail,
      subject,
      leadId,
      opportunityId,
      sentByUserId: userId,
      status: "Invalid",
      errorMessage: "Recipient email address is invalid.",
      attachments,
      emailBody: body
    };
    await logOutgoingEmail(logData);
    return res.status(400).json({
      success: false,
      message: "Recipient email address is invalid."
    });
  }

  try {
    let status = "Sent";
    let errorMessage = null;

    if (req.session?.outlook?.accessToken) {
      // Send via real Microsoft Graph API
      try {
        const client = getGraphClient(req.session.outlook.accessToken);
        await client.api("/me/sendMail").post({
          message: {
            subject: subject,
            body: {
              contentType: "HTML",
              content: body
            },
            toRecipients: [
              {
                emailAddress: {
                  address: recipientEmail
                }
              }
            ]
          }
        });
      } catch (graphErr) {
        console.error("Microsoft Graph send failed, marking as Failed:", graphErr);
        status = "Failed";
        errorMessage = graphErr.message;
      }
    } else {
      // Simulating email send (mock fallback)
      console.log("Outlook not connected. Simulating email send (mock).");
      status = "Sent";
    }

    const logData = {
      recipientEmail,
      subject,
      leadId,
      opportunityId,
      sentByUserId: userId,
      status,
      errorMessage,
      attachments,
      emailBody: body
    };
    await logOutgoingEmail(logData);

    if (status === "Failed") {
      return res.status(500).json({
        success: false,
        message: errorMessage
      });
    }

    res.json({
      success: true
    });

  } catch (err) {
    console.error("Send Mail Error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.deleteMail = async (req, res) => {
  try {
    if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    // Move the message to Deleted Items
    await client
      .api(`/me/messages/${req.params.id}/move`)
      .post({
        destinationId: "deleteditems"
      });

    res.json({
      success: true
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
      error: err.response?.body || err
    });
  }
};

exports.markUnread = async (req, res) => {
  try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    await client
      .api(`/me/messages/${req.params.id}`)
      .patch({
        isRead: false
      });

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.restoreMail = async (req, res) => {
  try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    await client
      .api(`/me/messages/${req.params.id}/move`)
      .post({
        destinationId: "Inbox"
      });

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.permanentDelete = async (req, res) => {
  try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    await client
      .api(`/me/messages/${req.params.id}`)
      .delete();

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.getEmailById = async (req, res) => {
  try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    const mail = await client
      .api(`/me/messages/${req.params.id}`)
      .expand("attachments")
      .get();

    res.json({
      id: mail.id,
      subject: mail.subject,
      sender: mail.from?.emailAddress?.address,
      recipients:
        mail.toRecipients?.map(r => r.emailAddress.address) || [],
      cc:
        mail.ccRecipients?.map(r => r.emailAddress.address) || [],
      bcc:
        mail.bccRecipients?.map(r => r.emailAddress.address) || [],
      body: mail.body?.content,
      bodyType: mail.body?.contentType,
      attachments: mail.attachments || [],
      isRead: mail.isRead,
      receivedDateTime: mail.receivedDateTime,
      conversationId: mail.conversationId
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.replyMail = async (req, res) => {
  try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    await client
      .api(`/me/messages/${req.params.id}/reply`)
      .post({
        message: {
          body: {
            contentType: "HTML",
            content: req.body.message
          }
        }
      });

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.replyAllMail = async (req, res) => {
  try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    await client
      .api(`/me/messages/${req.params.id}/replyAll`)
      .post({
        message: {
          body: {
            contentType: "HTML",
            content: req.body.message
          }
        }
      });

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.forwardMail = async (req, res) => {
  try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    await client
      .api(`/me/messages/${req.params.id}/forward`)
      .post({
        comment: req.body.comment,

        toRecipients: [
          {
            emailAddress: {
              address: req.body.to
            }
          }
        ]
      });

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.searchEmails = async (req, res) => {
  try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    const keyword = req.query.q;

    const mails = await client
      .api("/me/messages")
      .search(`"${keyword}"`)
      .top(30)
      .get();

    const emails = mails.value.map(mail => ({
      id: mail.id,
      sender: mail.from?.emailAddress?.address || "",
      recipient: "",
      subject: mail.subject || "(No Subject)",
      body: mail.bodyPreview || "",
      folder: "Search",
      date: mail.receivedDateTime,
      read: mail.isRead,
      replied: false,
      bounced: false,
      threadId: mail.conversationId,
      history: []
    }));

    res.json(emails);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success:false,
      message:err.message
    });

  }
};

exports.getAttachments = async (req,res)=>{

    try{

        const client=getGraphClient(req.session.outlook.accessToken)

        const attachments=await client

        .api(`/me/messages/${req.params.id}/attachments`)

        .get();

        res.json(attachments.value);

    }

    catch(err){

        console.error(err);

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.downloadAttachment = async (req,res)=>{

    try{

        const client=getGraphClient(req.session.outlook.accessToken)

        const attachment=await client

        .api(`/me/messages/${req.params.messageId}/attachments/${req.params.attachmentId}`)

        .get();

        res.json(attachment);

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.getConversation = async (req, res) => {
  try {
if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
}
    const client = getGraphClient(req.session.outlook.accessToken)

    const result = await client
      .api("/me/messages")
      .top(100)
      .select("id,subject,bodyPreview,conversationId,receivedDateTime,from,toRecipients,isRead")
      .get();

    const conversation = result.value.filter(
      mail => mail.conversationId === req.params.id
    );

res.json(

conversation.map(mail => ({

id: mail.id,

sender:
mail.from?.emailAddress?.address,

recipients:
mail.toRecipients?.map(
r => r.emailAddress.address
) || [],

subject: mail.subject,

body:
mail.body?.content ||
mail.bodyPreview,

receivedDateTime:
mail.receivedDateTime,

isRead:
mail.isRead

}))

);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.getProfile = async(req,res)=>{

    try{

        const client=getGraphClient(req.session.outlook.accessToken)

        const profile=await client.api("/me").get();

        res.json(profile);

    }

    catch(err){

        res.status(500).json({

            success:false,

            message:err.message

        });

    }

};

exports.getConnectionStatus = async (req, res) => {

    if (!req.session?.outlook) {

        return res.json({
            connected: false
        });

    }

    res.json({

        connected: true,

        email: req.session.outlook.email

    });

};

exports.createDraft = async (req, res) => {

    try {

        const client = getGraphClient(
            req.session.outlook.accessToken
        );

        const draft = await client
            .api("/me/messages")
            .post({

                subject: req.body.subject,

                body: {
                    contentType: "HTML",
                    content: req.body.body
                },

                toRecipients: req.body.to
                    ? [{
                        emailAddress: {
                            address: req.body.to
                        }
                    }]
                    : [],

                ccRecipients: req.body.cc
                    ? [{
                        emailAddress: {
                            address: req.body.cc
                        }
                    }]
                    : [],

                bccRecipients: req.body.bcc
                    ? [{
                        emailAddress: {
                            address: req.body.bcc
                        }
                    }]
                    : []

            });

        res.json(draft);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.updateDraft = async (req, res) => {

    const client = getGraphClient(
        req.session.outlook.accessToken
    );

    const draft = await client
        .api(`/me/messages/${req.params.id}`)
        .patch({

            subject: req.body.subject,

            body: {
                contentType: "HTML",
                content: req.body.body
            }

        });

    res.json(draft);

};

exports.sendDraft = async (req, res) => {

    const client = getGraphClient(
        req.session.outlook.accessToken
    );

    await client
        .api(`/me/messages/${req.params.id}/send`)
        .post({});

    res.json({
        success: true
    });

};

exports.getEmailLogs = async (req, res) => {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { sentAt: 'desc' }
    });
    return res.json(logs);
  } catch (err) {
    console.error("Prisma logs fetch failed, falling back to db.json:", err);
    try {
      const db = readJSONDB();
      const logs = db.emailLogs || [];
      logs.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
      return res.json(logs);
    } catch (e) {
      return res.status(500).json({ message: "Failed to load email logs" });
    }
  }
};
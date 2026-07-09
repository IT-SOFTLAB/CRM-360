const {

    getGraphClient

}=require("../services/graphService");

async function getFolderMessages(req, folderName) {
  if (!req.session?.outlook?.accessToken) {
    throw new Error("Outlook account is not connected.");
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

exports.sendMail=async(req,res)=>{

    try{

        const client=getGraphClient(req.session.outlook.accessToken)

        await client.api("/me/sendMail").post({

            message:{

                subject:req.body.subject,

                body:{

                    contentType:"HTML",

                    content:req.body.body

                },

                toRecipients:[

                    {

                        emailAddress:{

                            address:req.body.to

                        }

                    }

                ]

            }

        });

        res.json({

            success:true

        });

    }

    catch (err) {
    console.error("Send Mail Error:", err);

    res.status(500).json({
        success: false,
        message: err.message,
        error: err.response?.body || err
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
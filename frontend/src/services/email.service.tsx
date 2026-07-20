import api from "./api";

export const emailService = {

  connectOutlook: () => {
    window.location.href =
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login/outlook`;
      //"https://crm-360-wvd1.onrender.com/auth/login/outlook";
  },

  getInbox: async () => {
  try {
    const res = await api.get("/emails/inbox");
    return res.data;
  } catch (err: any) {
    console.log("EMAIL ERROR", err);
    console.log("STATUS", err.response?.status);
    console.log("DATA", err.response?.data);
    throw err;
  }
},

  getSent: async () => {
    const res = await api.get("/emails/sent");
    return res.data;
  },

  getDrafts: async () => {
    const res = await api.get("/emails/drafts");
    return res.data;
  },

  getTrash: async () => {
    const res = await api.get("/emails/trash");
    return res.data;
  },

  refreshInbox: async () => {
    const res = await api.get("/emails/inbox");
    return res.data;
  },

  sendEmail: async (payload: any) => {
    const res = await api.post("/emails/send", payload);
    return res.data;
  },

createDraft: async (payload: any) => {

    const res = await api.post(
        "/emails/draft",
        payload
    );

    return res.data;

},

updateDraft: async (
    id: string,
    payload: any
) => {

    const res = await api.patch(
        `/emails/draft/${id}`,
        payload
    );

    return res.data;

},

sendDraft: async (id: string) => {

    const res = await api.post(
        `/emails/draft/${id}/send`
    );

    return res.data;

},

  replyEmail: async (
    id: string,
    message: string
  ) => {

    return api.post(
      `/emails/${id}/reply`,
      {
        message
      }
    );

  },

  replyAll: async (
    id: string,
    message: string
  ) => {

    return api.post(
      `/emails/${id}/reply-all`,
      {
        message
      }
    );

  },

 forwardEmail: async (
  id: string,
  to: string,
  comment: string
) => {

  const res = await api.post(
    `/emails/${id}/forward`,
    {
      to,
      comment
    }
  );

  return res.data;

},

deleteEmail: async (id: string) => {

    const res = await api.delete(`/emails/${id}`);

    return res.data;

},
restoreEmail: async (id: string) => {

    const res = await api.post(
        `/emails/${id}/restore`
    );

    return res.data;

},

permanentDelete: async (id: string) => {

    const res = await api.delete(
        `/emails/${id}/permanent`
    );

    return res.data;

},

  markRead: async (id: string) => {

    const res = await api.patch(
        `/emails/${id}/read`
    );

    return res.data;

},
markUnread: async (id: string) => {

    const res = await api.patch(
        `/emails/${id}/unread`
    );

    return res.data;

},
getEmailDetails: async (id: string) => {

    const res = await api.get(`/emails/${id}`);

    return res.data;

},

getConversation: async (id: string) => {

    const res = await api.get(`/emails/conversation/${id}`);

    return res.data;

},

  search: async (keyword: string) => {

    const res = await api.get(
      `/emails/search/all?q=${keyword}`
    );

    return res.data;

  },

  getAttachments: async (id: string) => {

    const res = await api.get(
        `/emails/${id}/attachments`
    );

    return res.data;

},

downloadAttachment: async (
    messageId: string,
    attachmentId: string
) => {

    const res = await api.get(
        `/emails/${messageId}/attachments/${attachmentId}`
    );

    return res.data;

},

status: async () => {
    const res = await api.get("/emails/status");
    return res.data;
},

  profile: async () => {

    const res = await api.get("/emails/profile/me");

    return res.data;

  },

  getEmailLogs: async () => {
    const res = await api.get("/emails/logs");
    return res.data;
  }


};


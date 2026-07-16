"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { Email } from '../types/email';
import { emailService } from '../services/email.service';
import { ToastContext } from './ToastContext';
import { AuthContext } from './AuthContext';

export interface EmailContextType {

  emails: Email[];

  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;

  isConnected: boolean;

  connectedEmail: string;

  currentFolder: string;

  connectOutlook: () => void;

  loadInbox: () => Promise<void>;

  loadSent: () => Promise<void>;

  loadDrafts: () => Promise<void>;

  loadTrash: () => Promise<void>;

  refreshInbox: () => Promise<void>;

  handleSendEmail: (
    replyText: string,
    emailObject: any
  ) => Promise<boolean>;

deleteEmail: (id: string) => Promise<void>;

restoreEmail: (id: string) => Promise<void>;

markRead: (id: string) => Promise<void>;

markUnread: (id: string) => Promise<void>;

forwardEmail: (
    id: string,
    to: string
) => Promise<void>;

getEmailDetails: (
    id: string
) => Promise<any>;

getConversation: (
    id: string
) => Promise<any>;
  

replyEmail: (
    id: string,
    message: string
) => Promise<void>;

replyAllEmail: (
    id: string,
    message: string
) => Promise<void>;

permanentDelete: (
    id: string
) => Promise<void>;

searchEmails: (
    keyword: string
) => Promise<any>;

getProfile: () => Promise<any>;

getAttachments: (
    id: string
) => Promise<any>;
createDraft: (
    payload: any
) => Promise<any>;

updateDraft: (
    id: string,
    payload: any
) => Promise<any>;

sendDraft: (
    id: string
) => Promise<any>;

  emailLogs: any[];
  loadEmailLogs: () => Promise<void>;
}
export const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
const [isConnected, setIsConnected] = useState(false);
const [connectedEmail, setConnectedEmail] = useState("");
const [emails, setEmails] = useState<Email[]>([]);
const [emailLogs, setEmailLogs] = useState<any[]>([]);
const [currentFolder, setCurrentFolder] = useState("Inbox");
  const toastCtx = useContext(ToastContext);
  const authCtx = useContext(AuthContext);
  
// const connectOutlook = () => {

//     window.location.href =
//       "http://localhost:5000/auth/login/outlook";

// };
const connectOutlook = () => {

    emailService.connectOutlook();

};



// useEffect(() => {

//   const checkConnection = async () => {

//     try {

//       const profile = await emailService.profile();

//       setIsConnected(true);

//       setConnectedEmail(
//         profile.mail || profile.userPrincipalName
//       );

//       await loadInbox();

//     } catch (err) {

//       setIsConnected(false);

//       setConnectedEmail("");

//     }

//     // Still show success message after OAuth redirect
//     const params = new URLSearchParams(window.location.search);

//     if (params.get("connected") === "true") {

//       toastCtx?.addToast(
//         "success",
//         "Outlook connected successfully!"
//       );

//       window.history.replaceState({}, "", "/emails");
//     }

//   };

//   checkConnection();

// }, []);

// const user = authCtx?.user;

// useEffect(() => {
//   if (user?.email) {
//     setConnectedEmail(user.email);
//   }
// }, [user]);

useEffect(() => {

    const init = async () => {

        const status = await emailService.status();

        if (!status.connected) {
            setIsConnected(false);
            return;
        }

        setIsConnected(true);
        setConnectedEmail(status.email);

        await loadInbox();
    };

    init();

}, []);

const loadInbox = async () => {

    setCurrentFolder("Inbox");

    if (!isConnected) {
      setEmails([]);
      return;
    }

    const emails = await emailService.getInbox();

    setEmails(emails || []);

};

const loadSent = async () => {

    setCurrentFolder("Sent");

    if (!isConnected) {
      setEmails([]);
      return;
    }

    const emails = await emailService.getSent();

    setEmails(emails || []);

};

const loadDrafts = async () => {

    setCurrentFolder("Drafts");

    if (!isConnected) {
      setEmails([]);
      return;
    }

    const emails = await emailService.getDrafts();

    setEmails(emails || []);

};

const loadTrash = async () => {

    setCurrentFolder("Trash");

    if (!isConnected) {
      setEmails([]);
      return;
    }

    const emails = await emailService.getTrash();

    setEmails(emails || []);

};

const refreshInbox = async () => {

    switch (currentFolder) {

        case "Inbox":
            await loadInbox();
            break;

        case "Sent":
            await loadSent();
            break;

        case "Drafts":
            await loadDrafts();
            break;

        case "Trash":
            await loadTrash();
            break;

        default:
            await loadInbox();
            break;

    }

};
const deleteEmail = async (id: string) => {

  await emailService.deleteEmail(id);

  await refreshInbox();

};

const restoreEmail = async (id: string) => {

  await emailService.restoreEmail(id);

  await refreshInbox();

};

const markRead = async (id: string) => {

  await emailService.markRead(id);

  await refreshInbox();

};
const markUnread = async (id: string) => {

  await emailService.markUnread(id);

  await refreshInbox();

};

const forwardEmail = async (
  id: string,
  to: string
) => {

  await emailService.forwardEmail(
    id,
    to,
    ""
  );

};

const getEmailDetails = async (
  id: string
) => {

  return await emailService.getEmailDetails(id);

};

const getConversation = async (
  id: string
) => {

  return await emailService.getConversation(id);

};

const replyEmail = async (
    id: string,
    message: string
) => {

    await emailService.replyEmail(
        id,
        message
    );

    await refreshInbox();

};

const replyAllEmail = async (
    id: string,
    message: string
) => {

    await emailService.replyAll(
        id,
        message
    );

    await refreshInbox();

};

const permanentDelete = async (
    id: string
) => {

    await emailService.permanentDelete(id);

    await refreshInbox();

};

const searchEmails = async (
    keyword: string
) => {

    return await emailService.search(keyword);

};

const getProfile = async () => {

    return await emailService.profile();

};

const getAttachments = async (
    id: string
) => {

    return await emailService.getAttachments(id);

};
const createDraft = async (payload: any) => {

    const draft = await emailService.createDraft(payload);

    toastCtx?.addToast(
        "success",
        "Draft saved successfully."
    );

    await loadDrafts();

    return draft;

};
const updateDraft = async (
    id: string,
    payload: any
) => {

    const draft = await emailService.updateDraft(
        id,
        payload
    );

    toastCtx?.addToast(
        "success",
        "Draft updated."
    );

    await loadDrafts();

    return draft;

};
const sendDraft = async (id: string) => {

    await emailService.sendDraft(id);

    toastCtx?.addToast(
        "success",
        "Draft sent successfully."
    );

    await loadSent();

};



  const handleSendEmail = async (replyText: string, emailObject: any): Promise<boolean> => {
    try {
      const payload = {
        to: emailObject.sender,
        subject: emailObject.subject.startsWith('Re:') ? emailObject.subject : `Re: ${emailObject.subject}`,
        body: replyText
      };

      const res = await emailService.sendEmail(payload);
      if (res && (res.error === true || res.success === false)) {
        console.warn("Error sending email:", res);
        toastCtx?.addToast('error', res.message || "Failed to send email");
        await loadEmailLogs();
        return false;
      }

      toastCtx?.addToast(
          "success",
          "Email sent successfully!"
      );
      
      if (isConnected) {
        await refreshInbox();
      }
      await loadEmailLogs();
      return true;
    } catch (err: any) {
      console.warn("Error sending email:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to send email";
      toastCtx?.addToast('error', errMsg);
      await loadEmailLogs();
      return false;
    }
  };

  const loadEmailLogs = async () => {
    try {
      const logs = await emailService.getEmailLogs();
      setEmailLogs(logs || []);
    } catch (err) {
      console.error("Failed to load email logs:", err);
    }
  };

  return (
  <EmailContext.Provider
value={{
    emails,
    setEmails,

    isConnected,
    connectedEmail,

    currentFolder,

    connectOutlook,

    loadInbox,
    loadSent,
    loadDrafts,
    loadTrash,

   refreshInbox,

handleSendEmail,

deleteEmail,

restoreEmail,

markRead,

markUnread,

forwardEmail,

getEmailDetails,

getConversation,

replyEmail,

replyAllEmail,

permanentDelete,

searchEmails,

getProfile,

getAttachments,

createDraft,

updateDraft,

sendDraft,
    emailLogs,
    loadEmailLogs,
}}
>
      {children}
    </EmailContext.Provider>
  );
};

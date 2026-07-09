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
  ) => Promise<void>;

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
}
export const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
const [isConnected, setIsConnected] = useState(false);
const [connectedEmail, setConnectedEmail] = useState("");
const [emails, setEmails] = useState<Email[]>([]);
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



useEffect(() => {

  const checkConnection = async () => {

    try {

      const profile = await emailService.profile();

      setIsConnected(true);

      setConnectedEmail(
        profile.mail || profile.userPrincipalName
      );

      await loadInbox();

    } catch (err) {

      setIsConnected(false);

      setConnectedEmail("");

    }

    // Still show success message after OAuth redirect
    const params = new URLSearchParams(window.location.search);

    if (params.get("connected") === "true") {

      toastCtx?.addToast(
        "success",
        "Outlook connected successfully!"
      );

      window.history.replaceState({}, "", "/emails");
    }

  };

  checkConnection();

}, []);

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

    const emails = await emailService.getInbox();

    setEmails(emails || []);

};

const loadSent = async () => {

    setCurrentFolder("Sent");

    const emails = await emailService.getSent();

    setEmails(emails || []);

};

const loadDrafts = async () => {

    setCurrentFolder("Drafts");

    const emails = await emailService.getDrafts();

    setEmails(emails || []);

};

const loadTrash = async () => {

    setCurrentFolder("Trash");

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




  const handleSendEmail = async (replyText: string, emailObject: any) => {
   // const user = authCtx?.user;
 const payload = {

    to: emailObject.sender,

    subject: `Re: ${emailObject.subject}`,

    body: replyText

};



    const res = await emailService.sendEmail(payload);
    if (res) {

    toastCtx?.addToast(
        "success",
        "Reply sent via Outlook!"
    );

    await refreshInbox();

} else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to send email');
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
   
}}
>
      {children}
    </EmailContext.Provider>
  );
};

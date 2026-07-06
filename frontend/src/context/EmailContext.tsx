"use client";

import React, { createContext, useState, useContext } from 'react';
import { Email } from '../types/email';
import { emailService } from '../services/email.service';
import { ToastContext } from './ToastContext';
import { AuthContext } from './AuthContext';
import { OFFLINE_EMAILS } from '../utils/constants';

export interface EmailContextType {
  emails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  loadEmails: () => Promise<void>;
  handleSendEmail: (replyText: string, emailObject: any) => Promise<void>;
}

export const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [emails, setEmails] = useState<Email[]>([]);

  const toastCtx = useContext(ToastContext);
  const authCtx = useContext(AuthContext);

  const loadEmails = async () => {
    const apiEmails = await emailService.getEmails();
    if (apiEmails) {
      setEmails(apiEmails);
    } else if (emails.length === 0) {
      setEmails(OFFLINE_EMAILS);
    }
  };

  const handleSendEmail = async (replyText: string, emailObject: any) => {
    const user = authCtx?.user;
    const payload = {
      sender: user?.email || 'superadmin@crm.com',
      recipient: emailObject.sender,
      subject: `Re: ${emailObject.subject}`,
      body: replyText,
      folder: 'Sent',
      threadId: emailObject.threadId,
      history: [
        { sender: emailObject.sender, body: emailObject.body, date: emailObject.date },
        ...(emailObject.history || [])
      ]
    };

    const res = await emailService.sendEmail(payload);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Reply sent via Outlook!');
      await loadEmails();
    } else {
      const mockEmail = {
        id: 'e_' + Date.now(),
        date: new Date().toISOString(),
        read: true,
        replied: true,
        bounced: false,
        ...payload
      };
      setEmails(prev => [mockEmail, ...prev]);
      if (toastCtx) toastCtx.addToast('success', 'Reply sent (Offline Simulated)');
    }
  };

  return (
    <EmailContext.Provider value={{
      emails,
      setEmails,
      loadEmails,
      handleSendEmail
    }}>
      {children}
    </EmailContext.Provider>
  );
};

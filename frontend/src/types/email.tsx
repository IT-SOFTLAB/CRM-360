export interface EmailHistory {
  sender: string;
  body: string;
  date: string;
}

export interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  folder: string;
  date: string;
  read: boolean;
  replied: boolean;
  bounced: boolean;
  threadId: string;
  history: EmailHistory[];
}

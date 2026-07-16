export interface Activity {
  id: string;

  title: string;

  type: string;

  date: string;

  time: string;

  duration: number;

  description: string;

  salesperson: string;

  done: boolean;

  leadId?: string;

  opportunityId?: string;

  // Outlook Integration
  location?: string;

  attendees?: string[];

  syncOutlook?: boolean;

  teamsMeeting?: boolean;

  startTime?: string;

  endTime?: string;

  isOutlookSynced?: boolean;

  outlookEventId?: string;

  meetingUrl?: string;
}
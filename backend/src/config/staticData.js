const categories = [
  'Healthcare',
  'Manufacturing',
  'Education',
  'Real Estate',
  'E-Commerce',
  'Finance',
  'Logistics',
  'Hospitality',
  'IT Services'
];

const companyBranding = {
  name: 'Global CRM Cloud',
  primaryColor: '#2563EB',
  secondaryColor: '#0F172A',
  logoText: 'CRM 360'
};

const subDays = (d) => {
  const now = new Date();
  return new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
};

const mockEmails = [
  {
    id: 'e_1',
    sender: 'tony@starkindustries.com',
    recipient: 'superadmin@crm.com',
    subject: 'Re: Stark CRM Proposal Draft',
    body: 'The proposal looks great John, but we need to ensure the Recharts analytics widget can ingest 50k events per second. Let\'s discuss in our meeting tomorrow.',
    folder: 'Inbox',
    date: subDays(1),
    read: false,
    replied: false,
    bounced: false,
    threadId: 'th_stark_1',
    history: [
      { sender: 'superadmin@crm.com', body: 'Hi Tony, attached is the draft proposal. Please let me know your thoughts.', date: subDays(2) },
      { sender: 'tony@starkindustries.com', body: 'Thanks, checking it now.', date: subDays(2) }
    ]
  },
  {
    id: 'e_2',
    sender: 'bruce@waynecorp.com',
    recipient: 'admin@crm.com',
    subject: 'Wayne Enterprises - Contract Updates',
    body: 'Sarah, I have requested my legal team to review the liability terms. Please expect updates by Thursday.',
    folder: 'Inbox',
    date: subDays(2),
    read: true,
    replied: true,
    bounced: false,
    threadId: 'th_wayne_1',
    history: []
  },
  {
    id: 'e_3',
    sender: 'superadmin@crm.com',
    recipient: 'clark@dailyplanet.com',
    subject: 'Welcome to CRM - Auto Enrollment Code',
    body: 'Hi Clark, congratulations on closing the deal! You are now auto-enrolled in our CRM Referral Program. Your referral code is REF-CLARK-99.',
    folder: 'Sent',
    date: subDays(4),
    read: true,
    replied: false,
    bounced: false,
    threadId: 'th_clark_ref_1',
    history: []
  },
  {
    id: 'e_4',
    sender: 'error-daemon@outlook.com',
    recipient: 'user@crm.com',
    subject: 'Undeliverable: Weekly Sales Report',
    body: 'Your email to reporting-bot@globalcloud.org could not be delivered because the mailbox is full or disabled.',
    folder: 'Inbox',
    date: subDays(6),
    read: false,
    replied: false,
    bounced: true,
    threadId: 'th_bounce_1',
    history: []
  }
];

module.exports = {
  categories,
  companyBranding,
  mockEmails
};

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Plus,
  RefreshCcw,
  Link2,
  Unlink,
  X
} from "lucide-react";
import { useToast } from '../../hooks/useToast';

interface EmailsViewProps {
  emails: any[];
  user: any;
  searchQuery: string;
  leads: any[];
  categories: string[];
  emailLogs: any[];
  loadEmailLogs: () => Promise<void>;

  isConnected: boolean;
  connectedEmail: string;

  connectOutlook: () => void;

  refreshInbox: () => Promise<void>;

  loadInbox: () => Promise<void>;
  loadSent: () => Promise<void>;
  loadDrafts: () => Promise<void>;
  loadTrash: () => Promise<void>;

  onSendReply: (
    replyText: string,
    emailObj: any
  ) => Promise<any>;
currentFolder: string;
  applyFilters: (
    data: any[],
    type: "leads" | "opportunities" | "emails"
  ) => any[];


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
}

export default function EmailsView({

  emails,

  user,

  searchQuery,
  leads,
  categories,
  emailLogs,
  loadEmailLogs,

  isConnected,
  connectedEmail,
  connectOutlook,
currentFolder,
 refreshInbox,

loadInbox,
loadSent,
loadDrafts,
loadTrash,

deleteEmail,
restoreEmail,

markRead,
markUnread,

forwardEmail,

getEmailDetails,
getConversation,

createDraft,
updateDraft,
sendDraft,

onSendReply,

  applyFilters

}: EmailsViewProps) {
  const toastCtx = useToast();
  
  //const [emailFolder, setEmailFolder] = useState('Inbox');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [emailReplyText, setEmailReplyText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [currentView, setCurrentView] = useState<'outlook' | 'dashboard'>('outlook');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showLogDrawer, setShowLogDrawer] = useState(false);

  // Filter states
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
const [composeForm, setComposeForm] = useState({
  to: "",
  cc: "",
  bcc: "",
  subject: "",
  body: ""
});

  const GENERAL_TEMPLATES = [
    { id: 'blank', label: 'Blank Email', subject: '', body: '' },
    {
      id: 'welcome',
      label: 'Welcome Email',
      subject: 'Welcome to CRM-360',
      body: `Hi {{contactName}},\n\nWelcome to CRM-360.\n\nThank you for connecting with us.\n\nWe look forward to helping your organization streamline customer relationship management and improve sales productivity.\n\nIf you have any questions, feel free to contact us.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'product_intro',
      label: 'Product Introduction',
      subject: 'Introducing CRM-360',
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nI'd like to introduce CRM-360, a complete CRM platform designed to manage leads, opportunities, customer interactions, quotations, and sales activities efficiently.\n\nWe would love to demonstrate how CRM-360 can benefit your organization.\n\nPlease let us know if you'd like to schedule a demo.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'follow_up',
      label: 'Follow-up',
      subject: 'Following Up on Our Previous Conversation',
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nI wanted to follow up regarding our previous discussion.\n\nPlease let us know if you have any questions or require additional information.\n\nLooking forward to your response.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'meeting_request',
      label: 'Meeting Request',
      subject: 'Meeting Request',
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nWe would appreciate the opportunity to meet with you to discuss your business requirements and demonstrate how CRM-360 can help your organization.\n\nPlease let us know a suitable date and time.\n\nLooking forward to meeting with you.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'quote_follow_up',
      label: 'Quotation Follow-up',
      subject: 'Follow-up Regarding Your Quotation',
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nI wanted to follow up regarding the quotation we shared.\n\nPlease let us know if you have any questions or if you require any modifications.\n\nWe look forward to hearing from you.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'thank_you',
      label: 'Thank You',
      subject: 'Thank You',
      body: `Hi {{contactName}},\n\nThank you for taking the time to connect with us.\n\nWe truly appreciate the opportunity to work with you.\n\nIf there is anything else we can assist you with, please don't hesitate to reach out.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    }
  ];

  const getCategoryTemplates = (categoriesList: string[]) => {
    return categoriesList.map(cat => ({
      id: `category_${cat}`,
      label: `${cat} Template`,
      subject: `Helping Your ${cat} Business Grow with CRM-360`,
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nWe noticed that your organization operates in the ${cat} industry.\n\nCRM-360 helps businesses manage leads, automate follow-ups, organize sales pipelines, and improve customer relationships from one platform.\n\nWe would be happy to schedule a quick demonstration and discuss how CRM-360 can support your business.\n\nPlease let us know a convenient time.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    }));
  };

  const resolvePlaceholders = (text: string, lead: any, senderUser: any, categoryName?: string) => {
    if (!text) return "";
    const currentDate = new Date().toISOString().split('T')[0];
    return text
      .replace(/\{\{contactName\}\}/g, lead?.contactName || lead?.name || "")
      .replace(/\{\{companyName\}\}/g, lead?.company || "")
      .replace(/\{\{category\}\}/g, categoryName || lead?.category || "")
      .replace(/\{\{email\}\}/g, lead?.email || "")
      .replace(/\{\{phone\}\}/g, lead?.phone || "")
      .replace(/\{\{assignedUser\}\}/g, lead?.assignedUser || "")
      .replace(/\{\{senderName\}\}/g, senderUser?.name || "")
      .replace(/\{\{senderEmail\}\}/g, senderUser?.email || "")
      .replace(/\{\{organizationName\}\}/g, senderUser?.company || "")
      .replace(/\{\{currentDate\}\}/g, currentDate);
  };

  const categoryTemplates = getCategoryTemplates(categories);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isTemplateManuallySelected, setIsTemplateManuallySelected] = useState(false);

  // Find matched lead
  const matchedLead = leads.find(l => l.email && composeForm.to && l.email.toLowerCase().trim() === composeForm.to.toLowerCase().trim());

  const applyTemplate = (template: any, lead: any) => {
    const resolvedSubject = resolvePlaceholders(template.subject, lead, user, lead?.category || (template.id.startsWith('category_') ? template.id.replace('category_', '') : ''));
    const resolvedBody = resolvePlaceholders(template.body, lead, user, lead?.category || (template.id.startsWith('category_') ? template.id.replace('category_', '') : ''));
    setComposeForm(prev => ({
      ...prev,
      subject: resolvedSubject,
      body: resolvedBody
    }));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsTemplateManuallySelected(true);

    if (!templateId || templateId === 'blank') {
      setComposeForm(prev => ({ ...prev, subject: '', body: '' }));
      return;
    }

    const template = GENERAL_TEMPLATES.find(t => t.id === templateId) || 
                     categoryTemplates.find(t => t.id === templateId);

    if (template) {
      applyTemplate(template, matchedLead);
    }
  };

  // Reset manually selected when compose opens/closes
  useEffect(() => {
    if (showCompose) {
      setIsTemplateManuallySelected(false);
      setSelectedTemplateId('');
    }
  }, [showCompose]);

  // Handle automatic recommendation when "To" email changes
  useEffect(() => {
    if (!showCompose) return;
    
    const emailToMatch = composeForm.to.trim().toLowerCase();
    const lead = leads.find(l => l.email && l.email.toLowerCase().trim() === emailToMatch);
    
    if (!isTemplateManuallySelected) {
      if (lead && lead.category) {
        const templateId = `category_${lead.category}`;
        setSelectedTemplateId(templateId);
        
        const template = categoryTemplates.find(t => t.id === templateId);
        if (template) {
          setComposeForm(prev => ({
            ...prev,
            subject: resolvePlaceholders(template.subject, lead, user, lead.category),
            body: resolvePlaceholders(template.body, lead, user, lead.category)
          }));
        }
      } else {
        setSelectedTemplateId('');
        setComposeForm(prev => ({
          ...prev,
          subject: '',
          body: ''
        }));
      }
    }
  }, [composeForm.to, showCompose, leads, isTemplateManuallySelected, user, categories]);

  const handleSendEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmail && emailReplyText.trim()) {
      onSendReply(emailReplyText.trim(), selectedEmail)
        .then(() => {
          setEmailReplyText('');
        })
        .catch(() => {
          // Error is toasted by the context handler
        });
    }
  };

const handleComposeSend = async (
  e: React.FormEvent
) => {

  e.preventDefault();

  if (
    !composeForm.to ||
    !composeForm.subject ||
    !composeForm.body
  ) return;

  try {
    await onSendReply(
      composeForm.body,
      {
        sender: composeForm.to,
        subject: composeForm.subject
      }
    );

    setComposeForm({
      to:"",
      cc:"",
      bcc:"",
      subject:"",
      body:""
    });

    setShowCompose(false);
  } catch (err) {
    // Catch the error to prevent uncaught promise rejection developer overlays.
  }
};

const handleSaveDraft = async () => {

  await createDraft({
    to: composeForm.to,
    cc: composeForm.cc,
    bcc: composeForm.bcc,
    subject: composeForm.subject,
    body: composeForm.body
  });

  setComposeForm({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: ""
  });

  setShowCompose(false);

};

  // Trigger load when switching to dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadEmailLogs();
    }
  }, [currentView]);

  const filteredLogs = (emailLogs || []).filter(log => {
    // 1. Filter by recipient email
    if (filterSearch && !log.recipientEmail.toLowerCase().includes(filterSearch.toLowerCase())) {
      return false;
    }
    
    // 2. Filter by status
    if (filterStatus !== 'All' && log.status !== filterStatus) {
      return false;
    }
    
    // 3. Filter by Date Range
    if (filterDateRange !== 'All') {
      const logDate = new Date(log.sentAt);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (filterDateRange === 'Today') {
        if (logDate < startOfToday) return false;
      } else if (filterDateRange === 'Yesterday') {
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        if (logDate < startOfYesterday || logDate >= startOfToday) return false;
      } else if (filterDateRange === 'Last 7 Days') {
        const startOfSevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (logDate < startOfSevenDaysAgo) return false;
      }
    }
    
    return true;
  });

const filteredEmails = emails;

  return (
    <div className="space-y-4">
      {/* Header and Toggle Button */}
      <div className="flex justify-between items-center bg-card border border-border-crm rounded-2xl p-2.5 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <span className="font-extrabold text-sm tracking-tight text-txt-primary">
            {currentView === 'outlook' ? 'Outlook Email Client' : 'Email Status Dashboard'}
          </span>
        </div>
        <button
          onClick={() => setCurrentView(prev => prev === 'outlook' ? 'dashboard' : 'outlook')}
          className="bg-primary hover:bg-blue-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-xs"
        >
          {currentView === 'outlook' ? 'Email Status' : 'Outlook Email'}
        </button>
      </div>

      {currentView === 'outlook' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 border border-border-crm rounded-2xl shadow-xs overflow-hidden bg-card text-xs">
      
      {/* Column 1: Outlook Sidebar Folders */}
     <div className="bg-slate-50 border-r border-border-crm p-4 flex flex-col">

  {/* Outlook Connection */}

  <div className="bg-card rounded-xl border border-border-crm p-4 mb-4">

    <div className="flex items-center gap-2 mb-3">

      <Mail className="w-5 h-5 text-primary"/>

      <span className="font-bold">
        Outlook
      </span>

    </div>

    {isConnected ? (

      <>

        <div className="text-green-600 text-xs font-semibold">
          ● Connected
        </div>

        <div className="text-[11px] mt-1 break-all text-txt-secondary">
          {connectedEmail}
        </div>

      </>

    ) : (

      <>

        <div className="text-slate-400 text-xs">
          Not Connected
        </div>

        <button
          onClick={connectOutlook}
          className="mt-3 w-full bg-primary text-white rounded-lg py-2 text-xs flex justify-center items-center gap-2"
        >
          <Link2 className="w-4 h-4"/>
          Connect Outlook
        </button>

      </>

    )}

  </div>

  {/* Compose */}

  <button
    onClick={() => setShowCompose(true)}
    className="bg-primary text-white rounded-xl py-2 flex justify-center items-center gap-2 font-semibold mb-4"
  >

    <Plus className="w-4 h-4"/>

    Compose

  </button>

  {/* Refresh */}

  <button
  onClick={async () => {

    setSelectedEmail(null);

    await refreshInbox();

}}
    className="border border-border-crm rounded-xl py-2 flex justify-center items-center gap-2 mb-4 hover:bg-slate-100"
  >

    <RefreshCcw className="w-4 h-4"/>

    Refresh

  </button>

  {/* Folders */}

  <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary mb-3">

    Folders

  </h4>

  <div className="flex flex-col gap-1">

    {[
      {
        id: "Inbox",
        label: "Inbox",
        // count: emails.filter(
        //   e => e.folder === "Inbox" && !e.read
        // ).length
      },
      {
        id: "Sent",
        label: "Sent Mail",
       // count:emails.filter(e=>e.folder==="SentItems").length
      },
      {
        id: "Drafts",
        label: "Drafts",
        // count: emails.filter(
        //   e => e.folder === "Drafts"
        // ).length
      },
      {
        id: "Trash",
        label: "Trash",
//        count:emails.filter(
// e=>e.folder==="DeletedItems"
// ).length
      }
    ].map(folder => (

      <button
        key={folder.id}
        onClick={async()=>{

    setSelectedEmail(null);

   await loadInbox();

    switch(folder.id){

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

}}
        className={`flex justify-between px-3 py-2 rounded-xl text-xs ${
       currentFolder===folder.id
          ? "bg-primary/10 text-primary"
          : "hover:bg-slate-100"
        }`}
      >

        <span>{folder.label}</span>

       
      </button>

    ))}

  </div>

</div>

      {/* Column 2: Thread List */}
      <div className="border-r border-border-crm flex flex-col h-140">
        <div className="p-4 border-b border-border-crm bg-bg-main shrink-0">
          <span className="font-bold text-[10px] text-txt-secondary uppercase tracking-wider">Conversation Thread</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border-crm">
          {filteredEmails.map(email => (
            <div
              key={email.id}
      onClick={async () => {

  try {

    const details = await getEmailDetails(email.id);

    let thread = [];

    try {
      thread = await getConversation(details.conversationId);
    } catch (err) {
      console.log("Conversation not available");
    }

if (currentFolder === "Drafts") {

    setComposeForm({

        to: details.recipients?.join(", ") || "",

        cc: details.cc?.join(", ") || "",

        bcc: details.bcc?.join(", ") || "",

        subject: details.subject,

        body: details.body

    });

    setShowCompose(true);

    return;

}

    setSelectedEmail({
      ...details,
      history: thread
    });

    if (!details.isRead) {
      await markRead(details.id);
    }

  } catch (err) {
    console.error(err);
  }

}}
              className={`p-4 hover:bg-slate-50 cursor-pointer transition flex flex-col gap-1.5 ${
                selectedEmail?.id === email.id ? 'bg-slate-100 border-l-2 border-primary' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-txt-primary truncate">{email.sender}</span>
                <span className="text-[9px] text-slate-400">{new Date(
email.receivedDateTime || email.date
).toLocaleDateString()}</span>
              </div>
              <div className="font-semibold text-txt-primary truncate">{email.subject}</div>
              <div className="text-txt-secondary line-clamp-1">{email.body}</div>
            </div>
          ))}
          {filteredEmails.length === 0 && (
            <div className="text-center py-12 text-slate-400">Folder empty.</div>
          )}
        </div>
      </div>

      {/* Column 3: Detailed Thread View (Chatbox Style) & Tracking */}
      <div className="lg:col-span-2 flex flex-col h-140">
        {selectedEmail ? (
          <div className="flex flex-col h-full">
            
            {/* Subject header */}
            <div className="p-4 border-b border-border-crm bg-bg-main flex justify-between items-center shrink-0">
              <div>
                <h4 className="font-bold text-sm text-txt-primary">{selectedEmail.subject}</h4>
                {/* <p className="text-[10px] text-txt-secondary">Sender:
{selectedEmail.sender}

<br/>

To:
{selectedEmail.recipients?.join(", ")}</p> */}

<div className="text-[10px] text-txt-secondary">

<div>
From:
{selectedEmail.sender}
</div>

<div>
To:
{
selectedEmail.recipients?.join(", ")
}
</div>

</div>
              </div>
              
              {/* tracking metrics */}
             <div className="flex items-center gap-2">
                {selectedEmail.bounced ? (
                  <span className="bg-red-50 text-danger border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">Bounced</span>
                ) : (
                  <>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${selectedEmail.read ? 'bg-emerald-50 text-success border-emerald-200' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                      {selectedEmail.read ? 'Read' : 'Delivered'}
                    </span>
                    {selectedEmail.replied && (
                      <span className="bg-blue-50 text-primary border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">Replied</span>
                    )}
                  </>
                )}
              </div>

<div className="flex items-center gap-2">

{currentFolder === "Drafts" && (

<button
    onClick={async () => {

        await sendDraft(selectedEmail.id);

        await loadSent();

        setSelectedEmail(null);

    }}
    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs"
>

Send

</button>

)}

{currentFolder === "Trash" ? (

<button
    onClick={async () => {

        await restoreEmail(selectedEmail.id);

        setSelectedEmail(null);

    }}
    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs"
>

Restore

</button>

) : (

<button
    onClick={async () => {

        await deleteEmail(selectedEmail.id);

        setSelectedEmail(null);

    }}
    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs"
>

Delete

</button>

)}

</div>
            </div>

            {/* Thread messages scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              
              {/* Reply history blocks */}
            {/* Conversation Messages */}
{(selectedEmail.history || [])
.filter(
    (mail: any, index: number, self: any[]) =>
        index === self.findIndex(
            (m: any) => m.id === mail.id
        )
)
.map((hist: any) => (

<div
    key={hist.id}
    className={`flex flex-col max-w-[80%] rounded-2xl p-4 shadow-xs text-xs border ${
        hist.sender === connectedEmail
            ? "bg-primary text-white border-blue-600 ml-auto"
            : "bg-card text-txt-primary border-border-crm mr-auto"
    }`}
>

<div className="mb-2 text-[10px]">

<div>
<strong>From:</strong> {hist.sender}
</div>

<div>
<strong>To:</strong> {hist.recipients?.join(", ")}
</div>

<div className="text-slate-400">
{
new Date(
hist.receivedDateTime || hist.date
).toLocaleString()
}
</div>

</div>

<div
className="leading-relaxed"
dangerouslySetInnerHTML={{
__html: hist.body
}}
/>

</div>

))}

              {/* Original/Latest message block */}
            

            </div>

            {/* Reply Input Box */}
            {currentFolder !== "Drafts" && (
            <form onSubmit={handleSendEmailSubmit} className="p-4 border-t border-border-crm bg-card flex gap-2 shrink-0">
              <input
                type="text" required placeholder="Write Outlook reply email thread..."
                className="flex-1 border border-border-crm rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-txt-primary bg-bg-main"
                value={emailReplyText}
                onChange={e => setEmailReplyText(e.target.value)}
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white rounded-xl px-4 flex items-center justify-center font-bold shadow cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
)}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <Mail className="w-10 h-10 mb-2 opacity-50" />
            <p>Select email conversation thread to view tracker timeline.</p>
          </div>
        )}
      </div>
{
showCompose && (

<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">

<div className="bg-card rounded-2xl w-[700px] shadow-xl border border-border-crm">

<div className="flex justify-between items-center p-5 border-b">

<h3 className="font-bold text-lg">

New Message

</h3>

<button

onClick={()=>setShowCompose(false)}

className="text-slate-500"

>

✕

</button>

</div>

<form

onSubmit={handleComposeSend}

className="p-5 space-y-4"

>

<input

placeholder="To"

value={composeForm.to}

onChange={(e)=>

setComposeForm({

...composeForm,

to:e.target.value

})

}

className="w-full border rounded-xl px-4 py-2"

/>

<div className="grid grid-cols-2 gap-3">

<input

placeholder="CC"

value={composeForm.cc}

onChange={(e)=>

setComposeForm({

...composeForm,

cc:e.target.value

})

}

className="border rounded-xl px-4 py-2"

/>

<input

placeholder="BCC"

value={composeForm.bcc}

onChange={(e)=>

setComposeForm({

...composeForm,

bcc:e.target.value

})

}

className="border rounded-xl px-4 py-2"

/>

</div>

<div>
  <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Choose Template</label>
  <select
    value={selectedTemplateId}
    onChange={(e) => handleTemplateChange(e.target.value)}
    className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-slate-800 text-txt-primary border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary transition"
  >
    <option value="">▼ Select Template</option>
    <optgroup label="General Templates">
      {GENERAL_TEMPLATES.map(t => (
        <option key={t.id} value={t.id}>{t.label}</option>
      ))}
    </optgroup>
    <optgroup label="Category Templates">
      {categoryTemplates.map(t => (
        <option key={t.id} value={t.id}>{t.label}</option>
      ))}
    </optgroup>
  </select>
</div>

<input

placeholder="Subject"

value={composeForm.subject}

onChange={(e)=>

setComposeForm({

...composeForm,

subject:e.target.value

})

}

className="w-full border rounded-xl px-4 py-2"

/>

<textarea

rows={10}

placeholder="Write your email..."

value={composeForm.body}

onChange={(e)=>

setComposeForm({

...composeForm,

body:e.target.value

})

}

className="w-full border rounded-xl px-4 py-3 resize-none"

/>

<div className="flex justify-end gap-3">

<button
type="button"
onClick={() => setShowCompose(false)}
className="px-5 py-2 border rounded-xl"
>
Cancel
</button>

<button
type="button"
onClick={handleSaveDraft}
className="bg-yellow-500 text-white px-5 py-2 rounded-xl"
>
Save Draft
</button>

<button
type="submit"
className="bg-primary text-white px-6 py-2 rounded-xl"
>
Send
</button>

</div>

</form>

</div>

</div>

)}
        </div>
      ) : (
        <div className="border border-border-crm rounded-2xl shadow-xs p-4 bg-card text-xs space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 border border-slate-150 rounded-2xl p-2.5 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Search Recipient</label>
              <input
                type="text"
                placeholder="Search recipient..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="w-full border rounded-xl px-3 py-1 bg-white text-txt-primary border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full border rounded-xl px-3 py-1 bg-white text-txt-primary border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
              >
                <option value="All">All Statuses</option>
                <option value="Sent">🟢 Sent</option>
                <option value="Pending">🟡 Pending</option>
                <option value="Failed">🔴 Failed</option>
                <option value="Invalid">❌ Invalid Email</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Date Range</label>
              <select
                value={filterDateRange}
                onChange={e => setFilterDateRange(e.target.value)}
                className="w-full border rounded-xl px-3 py-1 bg-white text-txt-primary border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-border-crm rounded-2xl bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border-crm text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-3">Recipient</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Sent By</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Sent Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-crm text-txt-primary">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">
                      No email logs found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-medium text-primary">
                          <a href={`mailto:${log.recipientEmail}`} className="hover:underline">{log.recipientEmail}</a>
                        </td>
                        <td className="px-6 py-4 truncate max-w-xs">{log.subject.replace(/^Re:\s*/i, '')}</td>
                        <td className="px-6 py-4">{user?.name || 'Unknown'}</td>
                        <td className="px-6 py-4">
                          {log.status === 'Sent' && <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-semibold">🟢 Sent</span>}
                          {log.status === 'Pending' && <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded font-semibold">🟡 Pending</span>}
                          {log.status === 'Failed' && <span className="inline-flex items-center bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded font-semibold">🔴 Failed</span>}
                          {log.status === 'Invalid' && <span className="inline-flex items-center bg-slate-50 text-slate-700 border border-slate-100 px-2 py-0.5 rounded font-semibold">❌ Invalid Email</span>}
                        </td>
                        <td className="px-6 py-4">{new Date(log.sentAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setShowLogDrawer(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-txt-primary font-semibold px-3 py-1 rounded-lg transition cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Detail Drawer */}
      {showLogDrawer && selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setShowLogDrawer(false)} className="absolute inset-0 bg-black/30 backdrop-blur-xs"></div>
          <div className="relative w-120 max-w-full bg-card h-full shadow-2xl border-l border-border-crm p-6 flex flex-col z-10 text-txt-primary">
            
            <div className="flex justify-between items-center pb-4 border-b border-border-crm shrink-0">
              <h3 className="font-bold text-sm tracking-tight text-txt-primary">Email Log Details</h3>
              <button onClick={() => setShowLogDrawer(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Recipient</p>
                <p className="font-medium text-txt-primary mt-0.5">{selectedLog.recipientEmail}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Subject</p>
                <p className="font-medium text-txt-primary mt-0.5">{selectedLog.subject}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Status</p>
                  <div className="mt-1">
                    {selectedLog.status === 'Sent' && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-semibold">🟢 Sent</span>}
                    {selectedLog.status === 'Pending' && <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded font-semibold">🟡 Pending</span>}
                    {selectedLog.status === 'Failed' && <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded font-semibold">🔴 Failed</span>}
                    {selectedLog.status === 'Invalid' && <span className="bg-slate-50 text-slate-700 border border-slate-100 px-2 py-0.5 rounded font-semibold">❌ Invalid Email</span>}
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Sent By</p>
                  <p className="font-medium text-txt-primary mt-0.5">{user?.name || 'Unknown'}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Sent Date & Time</p>
                <p className="font-medium text-txt-primary mt-0.5">{new Date(selectedLog.sentAt).toLocaleString()}</p>
              </div>
              
              {selectedLog.errorMessage && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-800">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-rose-500">Error Message</p>
                  <p className="mt-1 leading-relaxed text-xs">{selectedLog.errorMessage}</p>
                </div>
              )}
              
              {selectedLog.attachments && (
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Attachments</p>
                  <p className="font-medium text-txt-primary mt-0.5">{selectedLog.attachments}</p>
                </div>
              )}
              
              <div className="border-t border-border-crm pt-4">
                <p className="text-slate-400 font-semibold uppercase text-[10px] mb-2">Email Body</p>
                <div 
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-h-96 overflow-y-auto text-xs whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedLog.emailBody }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

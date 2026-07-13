import React, { useState } from 'react';
import {
  Mail,
  Send,
  Plus,
  RefreshCcw,
  Link2,
  Unlink
} from "lucide-react";

interface EmailsViewProps {
  emails: any[];
  user: any;
  searchQuery: string;

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
  ) => void;
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
  
  //const [emailFolder, setEmailFolder] = useState('Inbox');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [emailReplyText, setEmailReplyText] = useState('');
  const [showCompose, setShowCompose] = useState(false);
const [composeForm, setComposeForm] = useState({
  to: "",
  cc: "",
  bcc: "",
  subject: "",
  body: ""
});

  const handleSendEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmail && emailReplyText.trim()) {
      onSendReply(emailReplyText.trim(), selectedEmail);
      setEmailReplyText('');
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

const filteredEmails = emails;

  return (
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
  );
}

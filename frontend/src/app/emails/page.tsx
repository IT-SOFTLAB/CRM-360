"use client";

import { useCRM } from "@/context/CRMContext";
import EmailsView from "@/components/crm/EmailsView";

export default function EmailsPage() {

  const crm = useCRM();

  return (

   <EmailsView

  emails={crm.emails}
  user={crm.user}
  searchQuery={crm.searchQuery}

  isConnected={crm.isConnected}
  connectedEmail={crm.connectedEmail}
 currentFolder={crm.currentFolder}

  connectOutlook={crm.connectOutlook}

  refreshInbox={crm.refreshInbox}

  loadInbox={crm.loadInbox}
  loadSent={crm.loadSent}
  loadDrafts={crm.loadDrafts}
  loadTrash={crm.loadTrash}

  deleteEmail={crm.deleteEmail}
  restoreEmail={crm.restoreEmail}

  markRead={crm.markRead}
  markUnread={crm.markUnread}

  forwardEmail={crm.forwardEmail}

  getEmailDetails={crm.getEmailDetails}
  getConversation={crm.getConversation}

  createDraft={crm.createDraft}
  updateDraft={crm.updateDraft}
  sendDraft={crm.sendDraft}

  onSendReply={crm.handleSendEmail}

  applyFilters={crm.applyFilters}

/>
  );

}
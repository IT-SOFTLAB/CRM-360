const express = require("express");
const router = express.Router();

const email = require("../controllers/emailController");

// ---------- Static Routes ----------
router.get("/status", email.getConnectionStatus);

router.get("/profile/me", email.getProfile);

router.get("/folders", email.getFolders);

router.get("/search/all", email.searchEmails);

router.get("/inbox", email.getInbox);

router.get("/sent", email.getSent);

router.get("/drafts", email.getDrafts);

router.get("/trash", email.getTrash);

router.get("/conversation/:id", email.getConversation);

router.get("/:id/attachments", email.getAttachments);

router.get(
    "/:messageId/attachments/:attachmentId",
    email.downloadAttachment
);

router.post("/send", email.sendMail);

// ---------- Dynamic Routes ----------
router.get("/:id", email.getEmailById);

router.post("/:id/reply", email.replyMail);

router.post("/:id/reply-all", email.replyAllMail);

router.post("/:id/forward", email.forwardMail);

router.post("/:id/restore", email.restoreMail);

router.patch("/:id/read", email.markRead);

router.patch("/:id/unread", email.markUnread);

router.delete("/:id/permanent", email.permanentDelete);

router.delete("/:id", email.deleteMail);

router.post("/draft", email.createDraft);
router.patch("/draft/:id", email.updateDraft);
router.post("/draft/:id/send", email.sendDraft);

module.exports = router;
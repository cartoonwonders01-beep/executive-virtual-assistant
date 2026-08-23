/**
 * Gmail Module for Google Apps Script
 */

function handleEmailDraft(payload) {
  const emailData = payload.emailData || payload;
  const to = emailData.toEmail || emailData.to || "recipient@example.com";
  const toName = emailData.toName || to.split("@")[0];
  const subject = emailData.subject || "Follow-up & Next Steps";
  const body = emailData.body || `Hi ${toName},\n\nI wanted to follow up regarding our recent discussion.\n\nBest regards,\nAndrew`;

  // Create Draft in Gmail
  const draft = GmailApp.createDraft(to, subject, body);

  const spoken = `I have prepared a draft email in your Gmail to ${toName} regarding ${subject}. It is ready in your Drafts folder for review.`;

  return {
    draftId: draft.getId(),
    to: to,
    toName: toName,
    subject: subject,
    status: "draft_created",
    spokenResponse: spoken
  };
}

function handleEmailSend(payload) {
  const emailData = payload.emailData || payload;
  const to = emailData.toEmail || emailData.to;
  const subject = emailData.subject || "Executive Follow-up";
  const body = emailData.body || "";

  if (!to) throw new Error("Recipient email is required to send");

  GmailApp.sendEmail(to, subject, body);

  return {
    status: "sent",
    to: to,
    subject: subject,
    spokenResponse: `Your email to ${to} has been sent successfully.`
  };
}

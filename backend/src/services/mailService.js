const nodemailer = require("nodemailer");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_SECURE:", process.env.SMTP_SECURE);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("EMAIL_FROM:", process.env.MAIL_FROM);
console.log("SMTP_PASS length:", process.env.SMTP_PASS?.length);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error("VERIFY ERROR:", err);
  } else {
    console.log("SMTP LOGIN SUCCESS");
  }
});
exports.sendMail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
      html,
    });

console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
    console.log(`Email sent successfully to ${to}`);

    return true;
  } catch (err) {
    console.error("SMTP Mail Error:", err);
    throw err;
  }
};
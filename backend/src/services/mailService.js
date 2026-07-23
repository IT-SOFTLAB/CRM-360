const nodemailer = require("nodemailer");
const dns = require("dns");

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
  // Add timeouts to prevent hanging connections in case of network/port blocks
  connectionTimeout: 10000, // 10 seconds
  socketTimeout: 10000,     // 10 seconds
  greetingTimeout: 10000,   // 10 seconds
  // Force IPv4 DNS lookup to bypass Render IPv6 SMTP routing issues
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  // Explicitly configure SNI servername for TLS handshake
  tls: {
    servername: process.env.SMTP_HOST || "smtp.gmail.com",
    rejectUnauthorized: false, // Prevents certificate verification failures in some containers
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
    console.log("A. Entered sendMail");

const info = await transporter.sendMail({
  from: process.env.MAIL_FROM,
  to,
  subject,
  text,
  html,
});

console.log("B. Mail sent successfully");
console.log(info);

console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
    console.log(`Email sent successfully to ${to}`);

    return true;
  } catch (err) {
    console.error("SMTP Mail Error:", err);
    throw err;
  }
};
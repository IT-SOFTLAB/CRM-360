const nodemailer = require("nodemailer");
const dns = require("dns").promises;

console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_SECURE:", process.env.SMTP_SECURE);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("EMAIL_FROM:", process.env.MAIL_FROM);
console.log("SMTP_PASS length:", process.env.SMTP_PASS?.length);

let transporterInstance = null;

async function getTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  let resolvedHost = smtpHost;

  try {
    console.log(`Resolving ${smtpHost} via dns.resolve4...`);
    const addresses = await dns.resolve4(smtpHost);
    if (addresses && addresses.length > 0) {
      resolvedHost = addresses[0];
      console.log(`Successfully resolved ${smtpHost} to IPv4: ${resolvedHost}`);
    }
  } catch (err) {
    console.warn(`Failed to resolve ${smtpHost} via resolve4, falling back to hostname:`, err.message);
  }

  transporterInstance = nodemailer.createTransport({
    host: resolvedHost,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // false for port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Add timeouts to prevent hanging connections in case of network/port blocks
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000,     // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    // Explicitly configure SNI servername for TLS handshake
    tls: {
      servername: smtpHost,
      rejectUnauthorized: false, // Prevents certificate verification failures in some containers
    },
  });

  return transporterInstance;
}

// Warm up and verify on startup
getTransporter()
  .then((transporter) => {
    transporter.verify((err, success) => {
      if (err) {
        console.error("VERIFY ERROR:", err);
      } else {
        console.log("SMTP LOGIN SUCCESS");
      }
    });
  })
  .catch((err) => {
    console.error("Failed to initialize transporter on startup:", err);
  });

exports.sendMail = async ({ to, subject, html, text }) => {
  try {
    console.log("A. Entered sendMail");
    const transporter = await getTransporter();

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
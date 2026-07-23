require("dotenv").config();
const nodemailer = require("nodemailer");
const dns = require("dns").promises;

async function test() {
  const smtpHost = "smtp.gmail.com";
  let resolvedHost = smtpHost;

  try {
    const addresses = await dns.resolve4(smtpHost);
    if (addresses && addresses.length > 0) {
      resolvedHost = addresses[0];
      console.log(`Resolved ${smtpHost} to IPv4: ${resolvedHost}`);
    }
  } catch (err) {
    console.error("DNS resolution failed:", err);
  }

  const transporter = nodemailer.createTransport({
    host: resolvedHost,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
    tls: {
      servername: smtpHost,
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP Login Successful with resolved IP:", resolvedHost);
  } catch (err) {
    console.error("❌ SMTP Login Failed");
    console.error(err);
  }
}

test();
require("dotenv").config();
const nodemailer = require("nodemailer");
const dns = require("dns");
async function test() {
  const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  tls: {
    servername: "smtp.gmail.com",
  },

  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
});
  try {
    await transporter.verify();
    console.log("✅ SMTP Login Successful");
  } catch (err) {
    console.error("❌ SMTP Login Failed");
    console.error(err);
  }
}

test();
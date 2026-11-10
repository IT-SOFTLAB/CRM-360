
const validatePhone = (phone) => {
  return /^[6-9]\d{9}$/.test(String(phone || "").trim());
};

const validateLinkedIn = (value) => {
  if (!value || !String(value).trim()) return true;

  try {
    const input = String(value).trim();
    const url = new URL(
      input.startsWith("http") ? input : `https://${input}`
    );

    return (
      ["linkedin.com", "www.linkedin.com"].includes(url.hostname) &&
      /^\/in\/[a-zA-Z0-9_%\-]+\/?$/.test(url.pathname)
    );
  } catch {
    return false;
  }
};

module.exports = {
  validatePhone,
  validateLinkedIn
};

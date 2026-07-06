export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone);
};

export const validateContactName = (name: string): { valid: boolean; error: string } => {
  if (!name.trim()) {
    return { valid: false, error: 'Contact Name is required' };
  }
  if (!/^[A-Za-z ]+$/.test(name)) {
    return { valid: false, error: 'Only letters and spaces are allowed' };
  }
  if (name.length < 3) {
    return { valid: false, error: 'Minimum 3 characters' };
  }
  return { valid: true, error: '' };
};

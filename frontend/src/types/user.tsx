export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  phone?: string;
}

export interface AuthForm {
  name?: string;
  email: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  company?: string;
  role?: string;
}

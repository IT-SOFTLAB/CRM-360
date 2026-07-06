export const isSuperAdmin = (user: any): boolean => {
  return user?.role === 'Super Admin';
};

export const isAdmin = (user: any): boolean => {
  return user?.role === 'Super Admin' || user?.role === 'Admin';
};

export const hasPermission = (user: any, action: string): boolean => {
  if (!user) return false;
  if (user.role === 'Super Admin') return true;
  return false;
};

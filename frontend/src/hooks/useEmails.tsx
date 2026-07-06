"use client";

import { useContext } from 'react';
import { EmailContext, EmailContextType } from '../context/EmailContext';

export const useEmails = (): EmailContextType => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmails must be used within an EmailProvider');
  }
  return context;
};

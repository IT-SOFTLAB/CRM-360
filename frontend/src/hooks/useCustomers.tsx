"use client";

import { useContext } from 'react';
import { CustomerContext, CustomerContextType } from '../context/CustomerContext';

export const useCustomers = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

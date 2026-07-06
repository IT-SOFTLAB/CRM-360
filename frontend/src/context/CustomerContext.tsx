"use client";

import React, { createContext, useState, useEffect } from 'react';
import { Customer } from '../types/customer';
import { customerService } from '../services/customer.service';

export interface CustomerContextType {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  loadCustomers: () => Promise<void>;
}

export const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const loadCustomers = async () => {
    const apiCustomers = await customerService.getCustomers();
    if (apiCustomers) {
      setCustomers(apiCustomers);
    }
  };

  return (
    <CustomerContext.Provider value={{ customers, setCustomers, loadCustomers }}>
      {children}
    </CustomerContext.Provider>
  );
};

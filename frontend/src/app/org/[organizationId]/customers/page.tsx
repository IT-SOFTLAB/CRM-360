"use client";

import { useEffect } from "react";
import CustomerView from "@/components/crm/CustomersView";
import { useCustomers } from "@/hooks/useCustomers";

export default function CustomerPage() {
  const { loadCustomers } = useCustomers();

  useEffect(() => {
    loadCustomers();
  }, []);

  return <CustomerView />;
}
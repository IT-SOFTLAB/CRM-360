import api from './api';

export const customerService = {
  getCustomers: async () => {
    try {
      const res = await api.get('/customers');
      return res.data;
    } catch (err) {
      console.warn('API error fetching customers, fallback to offline', err);
      return null;
    }
  },
  updateCustomer: async (customerId: string, customerData: any) => {
    try {
      const res = await api.put(`/customers/${customerId}`, customerData);
      return res.data;
    } catch (err) {
      console.warn('API error updating customer, fallback to offline', err);
      return null;
    }
  },
  deleteCustomer: async (customerId: string) => {
    try {
      const res = await api.delete(`/customers/${customerId}`);
      return res.data;
    } catch (err) {
      console.warn('API error deleting customer, fallback to offline', err);
      return null;
    }
  }
};

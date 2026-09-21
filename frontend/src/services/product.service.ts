import api from './api';

export interface Product {
  id: string;
  name: string;
  price: number;
  organizationId: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ProductData {
  name: string;
  price: number;
}

export const productService = {
  getAllProducts: async (): Promise<Product[]> => {
    const user = JSON.parse(
      localStorage.getItem('crm_user') || '{}'
    );

    const organizationId = user.organizationId;

    if (!organizationId) {
      throw new Error('Organization ID not found');
    }

    const res = await api.get(
      `/org/${organizationId}/products`
    );

    return res.data?.products || res.data || [];
  },

  getProduct: async (id: string): Promise<Product> => {
    const user = JSON.parse(
      localStorage.getItem('crm_user') || '{}'
    );

    const organizationId = user.organizationId;

    if (!organizationId) {
      throw new Error('Organization ID not found');
    }

    const res = await api.get(
      `/org/${organizationId}/products/${id}`
    );

    return res.data?.product || res.data;
  },

  createProduct: async (
    productData: ProductData
  ): Promise<Product> => {
    const user = JSON.parse(
      localStorage.getItem('crm_user') || '{}'
    );

    const organizationId = user.organizationId;

    if (!organizationId) {
      throw new Error('Organization ID not found');
    }

    const res = await api.post(
      `/org/${organizationId}/products`,
      productData
    );

    return res.data?.product || res.data;
  },

  updateProduct: async (
    id: string,
    productData: ProductData
  ): Promise<Product> => {
    const user = JSON.parse(
      localStorage.getItem('crm_user') || '{}'
    );

    const organizationId = user.organizationId;

    if (!organizationId) {
      throw new Error('Organization ID not found');
    }

    const res = await api.put(
      `/org/${organizationId}/products/${id}`,
      productData
    );

    return res.data?.product || res.data;
  },

  changeProductStatus: async (
    id: string,
    status: 'Active' | 'Inactive'
  ): Promise<Product> => {
    const user = JSON.parse(
      localStorage.getItem('crm_user') || '{}'
    );

    const organizationId = user.organizationId;

    if (!organizationId) {
      throw new Error('Organization ID not found');
    }

    const res = await api.patch(
      `/org/${organizationId}/products/${id}/status`,
      { status }
    );

    return res.data?.product || res.data;
  },

  deleteProduct: async (id: string) => {
    const user = JSON.parse(
      localStorage.getItem('crm_user') || '{}'
    );

    const organizationId = user.organizationId;

    if (!organizationId) {
      throw new Error('Organization ID not found');
    }

    const res = await api.delete(
      `/org/${organizationId}/products/${id}`
    );

    return res.data;
  },
};
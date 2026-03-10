import apiClient from './apiClient';
import { ApiResponse, VendorProduct, Category } from '@city-market/shared';

export const ProductService = {
  getVendorProducts: async (vendorId: string) => {
    const response = await apiClient.get<ApiResponse<{ data: VendorProduct[] }>>(
      `/catalog/products/vendor/${vendorId}`,
    );
    return response.data?.data;
  },
  getCategories: async () => {
    const response = await apiClient.get<ApiResponse<Category[]>>(
      '/catalog/categories',
    );
    return response.data?.data;
  },
  getVendorCategories: async (vendorId: string) => {
    const response = await apiClient.get<ApiResponse<Category[]>>(
      `/catalog/categories/vendor/${vendorId}`,
    );
    return response.data?.data;
  },
  updateStock: async (id: string, stock?: number, weight?: number) => {
    const payload: any = {};
    if (stock !== undefined) payload.stock = stock;
    if (weight !== undefined) payload.weight = weight;
    const response = await apiClient.patch<ApiResponse<null>>(
      `/catalog/products/${id}/stock`,
      payload,
    );
    return response.data?.data;
  },
};

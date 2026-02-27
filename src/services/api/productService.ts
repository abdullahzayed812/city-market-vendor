import apiClient from './apiClient';
import { ApiResponse, Product, Category } from '@city-market/shared';

export const ProductService = {
  getVendorProducts: async (vendorId: string) => {
    const response = await apiClient.get<ApiResponse<Product[]>>(`/catalog/products/vendor/${vendorId}`);
    return response.data?.data;
  },
  getCategories: async () => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/catalog/categories');
    return response.data?.data;
  },
};

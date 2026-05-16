import apiClient from './apiClient';
import { ApiResponse, VendorProduct, Category } from '@city-market/shared';

export const ProductService = {
  getVendorProducts: async (vendorId: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get<ApiResponse<{ data: VendorProduct[]; total: number; page: number; limit: number }>>(
      `/catalog/products/vendor/${vendorId}`,
      { params: { page, limit } }
    );
    return response.data?.data;
  },
  getVendorProductsByCategory: async (vendorId: string, categoryId: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get<ApiResponse<{ data: VendorProduct[]; total: number; page: number; limit: number }>>(
      `/catalog/products/vendor/${vendorId}`,
      { params: { vendorCategoryId: categoryId, page, limit } }
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
  updatePrice: async (id: string, price: number) => {
    const response = await apiClient.patch<ApiResponse<null>>(
      `/catalog/products/${id}/price`,
      { price },
    );
    return response.data?.data;
  },
  createVendorProduct: async (data: any) => {
    const response = await apiClient.post<ApiResponse<VendorProduct>>(
      '/catalog/products',
      data,
    );
    return response.data?.data;
  },
  getGlobalCategories: async () => {
    const response = await apiClient.get<ApiResponse<Category[]>>(
      '/catalog/categories/global',
    );
    return response.data?.data;
  },
  getGlobalProducts: async (page: number = 1, limit: number = 100, search?: string) => {
    const response = await apiClient.get<ApiResponse<{ data: any[]; total: number }>>(
      '/catalog/global-products',
      { params: { page, limit, search } }
    );
    return response.data?.data;
  },
};

import apiClient from './apiClient';
import { ApiResponse, Vendor, ShopStatus } from '@city-market/shared';

export const VendorService = {
  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<Vendor>>('/vendors/me');
    return response.data?.data;
  },
  updateStatus: async (id: string, status: ShopStatus) => {
    const response = await apiClient.patch<ApiResponse<null>>(`/vendors/${id}/status`, { status });
    return response.data?.data;
  },
  updateProfile: async (id: string, data: any) => {
    const response = await apiClient.patch<ApiResponse<null>>(`/vendors/${id}`, data);
    return response.data?.data;
  },
};

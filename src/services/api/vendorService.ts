import apiClient from './apiClient';
import { ApiResponse, Vendor, ShopStatus } from '@city-market/shared';

export interface PickedImage {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
}

// Merchant application; the same contract as the vendor web dashboard (vendor-service POST /register)
export interface StoreApplication {
  shopName: string;
  shopDescription?: string;
  ownerName: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  ownerNationalIdUrl: string;
  commercialRegisterUrl: string;
  taxCardUrl?: string | null;
}

export const VendorService = {
  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<Vendor>>('/vendors/me');
    return response.data?.data;
  },
  // Registration document; media-service picks the storage path inside vendor-documents
  uploadDocument: async (image: PickedImage, onProgress?: (percent: number) => void): Promise<string> => {
    const form = new FormData();
    form.append('file', { uri: image.uri, type: image.type || 'image/jpeg', name: image.fileName || 'document.jpg' } as any);
    form.append('folder', 'vendor-documents');
    const response = await apiClient.post<ApiResponse<{ url: string }>>('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
      onUploadProgress: e => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
      },
    });
    return response.data.data!.url;
  },
  registerStore: async (application: StoreApplication) => {
    const response = await apiClient.post<ApiResponse<Vendor>>('/vendors/register', application);
    return response.data?.data;
  },
  // Correct the application while it waits for review, or after a rejection
  resubmitStore: async (application: StoreApplication) => {
    const response = await apiClient.put<ApiResponse<Vendor>>('/vendors/me/registration', application);
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

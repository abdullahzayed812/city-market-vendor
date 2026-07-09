import { Platform } from 'react-native';
import apiClient from './apiClient';
import { ApiResponse, LoginDto } from '@city-market/shared';
import { getDeviceId } from '../../utils/deviceId';

export const AuthService = {
  login: async (credentials: LoginDto) => {
    const deviceId = await getDeviceId();
    const response = await apiClient.post<ApiResponse<any>>('/auth/login', {
      ...credentials,
      deviceId,
      platform: Platform.OS,
    });
    return response.data?.data;
  },
  logout: async () => {
    const response = await apiClient.post<ApiResponse<any>>('/auth/logout');
    return response.data?.data;
  },
  logoutAll: async () => {
    const response = await apiClient.post<ApiResponse<any>>('/auth/logout-all');
    return response.data?.data;
  },
  refresh: async (refreshToken: string) => {
    const deviceId = await getDeviceId();
    const response = await apiClient.post<ApiResponse<any>>('/auth/refresh', {
      refreshToken,
      deviceId,
      platform: Platform.OS,
    });
    return response.data?.data;
  },
};

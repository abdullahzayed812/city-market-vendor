import apiClient from './apiClient';
import { ApiResponse, LoginDto } from '@city-market/shared';

export const AuthService = {
  login: async (credentials: LoginDto) => {
    const response = await apiClient.post<ApiResponse<any>>('/auth/login', credentials);
    return response.data?.data;
  },
  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<ApiResponse<any>>('/auth/refresh', { refreshToken });
    return response.data?.data;
  },
};

import apiClient from './apiClient';
import { ApiResponse, VendorOrderWithItemsDto, VendorOrderStatus, ProposeChangesDto, VendorOrder, VendorOrderItem, OrderItemProposal } from '@city-market/shared';

export const OrderService = {
  getVendorOrders: async (vendorId: string) => {
    const response = await apiClient.get<ApiResponse<VendorOrderWithItemsDto[]>>(`/orders/vendor/${vendorId}`);
    return response.data?.data;
  },
  getOrderById: async (id: string) => {
    const response = await apiClient.get<
      ApiResponse<VendorOrder & { items: VendorOrderItem[]; vendorName: string; proposals: OrderItemProposal[] }>
    >(`/orders/vendor-orders/${id}`);
    return response.data?.data;
  },
  acceptOrder: async (id: string) => {
    const response = await apiClient.post<ApiResponse<null>>(`/orders/vendor-orders/${id}/accept`);
    return response.data?.data;
  },
  proposeChanges: async (id: string, proposals: ProposeChangesDto[]) => {
    const response = await apiClient.post<ApiResponse<null>>(`/orders/vendor-orders/${id}/propose`, { proposals });
    return response.data?.data;
  },
  updateStatus: async (orderId: string, status: VendorOrderStatus) => {
    const response = await apiClient.patch<ApiResponse<null>>(`/orders/vendor-orders/${orderId}/status`, { status });
    return response.data?.data;
  },
};

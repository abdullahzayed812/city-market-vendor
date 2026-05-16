import apiClient from './apiClient';
import {
  ApiResponse,
  VendorOrderWithItemsDto,
  VendorOrderStatus,
  ProposeChangesDto,
  VendorOrder,
  VendorOrderItem,
  OrderItemProposal,
} from '@city-market/shared';

export const OrderService = {
  getVendorOrders: async (vendorId: string, page: number) => {
    const response = await apiClient.get<
      ApiResponse<{ items: VendorOrderWithItemsDto[]; hasNextPage: boolean }>
    >(`/orders/vendor/${vendorId}`, { params: { page, limit: 20 } });
    return response.data.data!;
  },
  getOrderById: async (id: string) => {
    const response = await apiClient.get<
      ApiResponse<
        VendorOrder & {
          items: VendorOrderItem[];
          vendorName: string;
          proposals: OrderItemProposal[];
        }
      >
    >(`/orders/vendor-orders/${id}`);
    return response.data?.data;
  },
  acceptOrder: async (id: string) => {
    const response = await apiClient.post<ApiResponse<null>>(
      `/orders/vendor-orders/${id}/accept`,
    );
    return response.data?.data;
  },
  proposeChanges: async (id: string, proposals: ProposeChangesDto[]) => {
    const response = await apiClient.post<ApiResponse<null>>(
      `/orders/vendor-orders/${id}/propose`,
      { proposals },
    );
    return response.data?.data;
  },
  updateStatus: async (
    orderId: string,
    status: VendorOrderStatus,
    itemWeights?: { itemId: string; actualWeightGrams: number }[],
  ) => {
    const response = await apiClient.patch<ApiResponse<null>>(
      `/orders/vendor-orders/${orderId}/status`,
      { status, itemWeights },
    );
    return response.data?.data;
  },
  getPendingEarnings: async (vendorId: string) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/orders/settlements/vendor/${vendorId}/pending`,
    );
    return response.data?.data;
  },
  getSettlements: async (vendorId: string) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/orders/settlements?vendorId=${vendorId}`,
    );
    return response.data?.data;
  },
};

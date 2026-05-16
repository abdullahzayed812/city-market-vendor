import { useCallback, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../app/SocketContext';
import { OrderService } from '../services/api/orderService';
import { EventType } from '@city-market/shared';
import { useAuth } from '../app/AuthContext';

export const useOrders = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { vendor } = useAuth();
  const vendorId = vendor?.id;

  const query = useInfiniteQuery({
    queryKey: ['vendor-orders', vendorId],
    queryFn: ({ pageParam }) => OrderService.getVendorOrders(vendorId!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasNextPage ? lastPageParam + 1 : undefined,
    enabled: !!vendorId,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['vendor-orders', vendorId] });
  }, [queryClient, vendorId]);

  useEffect(() => {
    if (!socket || !vendorId) return;

    const events = [
      EventType.ORDER_CONFIRMED,
      EventType.VENDOR_ORDER_CREATED,
      EventType.VENDOR_ORDER_CONFIRMED,
      EventType.VENDOR_ORDER_CANCELLED,
      EventType.ORDER_DELIVERED,
    ];

    events.forEach(event => socket.on(event, invalidate));
    return () => { events.forEach(event => socket.off(event, invalidate)); };
  }, [socket, vendorId, invalidate]);

  return {
    orders: query.data?.pages.flatMap(p => p.items ?? []) ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};

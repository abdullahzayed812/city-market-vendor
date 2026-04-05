import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../app/SocketContext';
import { OrderService } from '../services/api/orderService';
import { EventType } from '@city-market/shared';
import { useAuth } from '../app/AuthContext';

export const useOrders = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { vendor } = useAuth();
  const vendorId = vendor?.id;

  const { data: orders, isLoading } = useQuery({
    queryKey: ['vendor-orders', vendorId],
    queryFn: () => OrderService.getVendorOrders(vendorId!),
    enabled: !!vendorId,
  });

  useEffect(() => {
    if (!socket || !vendorId) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders', vendorId] });
    };

    const events = [
      EventType.VENDOR_ORDER_CREATED,
      EventType.VENDOR_ORDER_CONFIRMED,
      EventType.VENDOR_ORDER_CANCELLED,
      EventType.ORDER_DELIVERED,
    ];

    events.forEach(event => socket.on(event, handleUpdate));

    return () => {
      events.forEach(event => socket.off(event, handleUpdate));
    };
  }, [socket, vendorId, queryClient]);

  return { orders, isLoading };
};

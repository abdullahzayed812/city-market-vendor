import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../app/SocketContext';
import { OrderService } from '../services/api/orderService';
import { EventType, VendorOrderStatus, ProposeChangesDto } from '@city-market/shared';
import { useAuth } from '../app/AuthContext';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export const useOrderDetails = (orderId: string) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { vendor } = useAuth();
  const vendorId = vendor?.id;
  const { t } = useTranslation();

  const { data: order, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['vendorOrder', orderId],
    queryFn: () => OrderService.getOrderById(orderId),
    enabled: !!orderId,
  });

  const acceptMutation = useMutation({
    mutationFn: () => OrderService.acceptOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorOrder', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendorOrders', vendorId] });
      Toast.show({ type: 'success', text1: t('orders.order_accepted') });
    },
  });

  const proposeMutation = useMutation({
    mutationFn: (proposals: ProposeChangesDto[]) =>
      OrderService.proposeChanges(orderId, proposals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorOrder', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendorOrders', vendorId] });
      Toast.show({ type: 'success', text1: t('orders.proposal_sent') });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, itemWeights }: { status: VendorOrderStatus; itemWeights?: { itemId: string; actualWeightGrams: number }[] }) => 
      OrderService.updateStatus(orderId, status, itemWeights),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorOrder', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendorOrders', vendorId] });
    }
  });

  useEffect(() => {
    if (!socket || !orderId || !vendorId) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['vendorOrder', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendorOrders', vendorId] });
    };

    const events = [
      EventType.ORDER_CONFIRMED,
      EventType.PROPOSAL_ACCEPTED,
      EventType.PROPOSAL_REJECTED,
      EventType.VENDOR_ORDER_PROPOSED,
      EventType.VENDOR_ORDER_CONFIRMED,
      EventType.ORDER_DELIVERED,
    ];

    events.forEach(event => socket.on(event, handleUpdate));

    return () => {
      events.forEach(event => socket.off(event, handleUpdate));
    };
  }, [socket, orderId, vendorId, queryClient]);

  return {
    order,
    isLoading,
    error,
    refetch,
    isRefetching,
    acceptOrder: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,
    proposeChanges: proposeMutation.mutate,
    isProposing: proposeMutation.isPending,
    updateStatus: statusMutation.mutate,
    isUpdatingStatus: statusMutation.isPending,
  };
};

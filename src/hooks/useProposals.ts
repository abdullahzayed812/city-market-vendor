import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../app/SocketContext';
import { EventType } from '@city-market/shared';
import { useAuth } from '../app/AuthContext';

/**
 * useProposals
 * This hook handles real-time synchronization for order proposals.
 * Since proposals are usually fetched within order details, this hook
 * primarily manages invalidation when a proposal is accepted or rejected.
 */
export const useProposals = (orderId?: string) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { vendor } = useAuth();
  const vendorId = vendor?.id;

  useEffect(() => {
    if (!socket || !vendorId) return;

    const handleProposalUpdate = (data: any) => {
      // Invalidate the specific order details query
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ['vendorOrderDetails', orderId] });
      }
      
      // Also invalidate general orders list as status might have changed
      queryClient.invalidateQueries({ queryKey: ['vendorOrders', vendorId] });
    };

    const events = [
      EventType.PROPOSAL_ACCEPTED,
      EventType.PROPOSAL_REJECTED,
      EventType.VENDOR_ORDER_PROPOSED,
    ];

    events.forEach(event => socket.on(event, handleProposalUpdate));

    return () => {
      events.forEach(event => socket.off(event, handleProposalUpdate));
    };
  }, [socket, vendorId, orderId, queryClient]);

  // We return helper functions if needed in the future
  return {};
};

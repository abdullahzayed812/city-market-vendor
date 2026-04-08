import { useQuery } from '@tanstack/react-query';
import { OrderService } from '../services/api/orderService';
import { useAuth } from '../app/AuthContext';

export const useEarnings = () => {
    const { vendor } = useAuth();
    const vendorId = vendor?.id;

    const pendingQuery = useQuery({
        queryKey: ['pendingEarnings', vendorId],
        queryFn: () => OrderService.getPendingEarnings(vendorId!),
        enabled: !!vendorId,
    });

    const historyQuery = useQuery({
        queryKey: ['vendorSettlements', vendorId],
        queryFn: () => OrderService.getSettlements(vendorId!),
        enabled: !!vendorId,
    });

    return {
        pendingData: pendingQuery.data,
        settlements: historyQuery.data || [],
        isLoading: pendingQuery.isLoading || historyQuery.isLoading,
        isRefetching: pendingQuery.isRefetching || historyQuery.isRefetching,
        refetch: async () => {
            await Promise.all([pendingQuery.refetch(), historyQuery.refetch()]);
        },
    };
};

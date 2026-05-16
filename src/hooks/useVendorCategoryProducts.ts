import { useCallback, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../app/SocketContext';
import { ProductService } from '../services/api/productService';
import { useAuth } from '../app/AuthContext';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export const useVendorCategoryProducts = (categoryId: string) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { t } = useTranslation();
  const { vendor } = useAuth();
  const vendorId = vendor?.id;

  const { data, isLoading, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['vendorCategoryProducts', vendorId, categoryId],
      queryFn: ({ pageParam }) =>
        ProductService.getVendorProductsByCategory(vendorId!, categoryId, pageParam, 20),
      getNextPageParam: lastPage => {
        if (!lastPage || typeof lastPage.total !== 'number') return undefined;
        const { page, limit, total } = lastPage;
        return page * limit < total ? page + 1 : undefined;
      },
      enabled: !!vendorId && !!categoryId,
      initialPageParam: 1,
    });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['vendorCategoryProducts', vendorId, categoryId] });
  }, [queryClient, vendorId, categoryId]);

  useEffect(() => {
    if (!socket || !vendorId) return;
    const events = ['PRODUCT_UPDATED', 'STOCK_UPDATED'];
    events.forEach(e => socket.on(e, invalidate));
    return () => { events.forEach(e => socket.off(e, invalidate)); };
  }, [socket, vendorId, invalidate]);

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock, weight }: { id: string; stock?: number; weight?: number }) =>
      ProductService.updateStock(id, stock, weight),
    onSuccess: () => {
      invalidate();
      Toast.show({ type: 'success', text1: t('common.save'), text2: t('inventory.stock_updated') });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: t('common.error'), text2: error.message });
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      ProductService.updatePrice(id, price),
    onSuccess: () => {
      invalidate();
      Toast.show({ type: 'success', text1: t('common.save'), text2: t('inventory.price_updated') });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: t('common.error'), text2: error.message });
    },
  });

  return {
    products: data?.pages.flatMap(p => p?.data ?? []) ?? [],
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    updateStock: updateStockMutation.mutate,
    isUpdatingStock: updateStockMutation.isPending,
    updatePrice: updatePriceMutation.mutate,
    isUpdatingPrice: updatePriceMutation.isPending,
  };
};

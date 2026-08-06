import { useCallback, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '../services/api/productService';
import { useAuth } from '../app/AuthContext';
import { useSocket } from '../app/SocketContext';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import type { BulkAddVendorProductsFromGlobalItem } from '@city-market/shared';

const PAGE_SIZE = 20;

export const useProducts = (
  globalProductSearch?: string,
  globalCategoryId?: string,
  selectedCategoryId?: string,
) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { t } = useTranslation();
  const { vendor } = useAuth();
  const vendorId = vendor?.id;

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['vendorCategories', vendorId],
    queryFn: () => ProductService.getVendorCategories(vendorId!),
    enabled: !!vendorId,
  });

  const { data: globalCategoriesData } = useQuery({
    queryKey: ['globalCategories'],
    queryFn: () => ProductService.getGlobalCategories(),
  });

  const { data: globalProductsData, isLoading: globalProductsLoading } = useQuery({
    queryKey: ['globalProducts', globalProductSearch, globalCategoryId],
    queryFn: () => ProductService.getGlobalProducts(1, 100, globalProductSearch, globalCategoryId),
  });

  const {
    data: vendorProductsData,
    isLoading: vendorProductsLoading,
    refetch: refetchVendorProducts,
    isRefetching: isRefetchingVendorProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['vendorProducts', vendorId, selectedCategoryId || 'all'],
    queryFn: ({ pageParam }) =>
      ProductService.getVendorProducts(vendorId!, pageParam, PAGE_SIZE, selectedCategoryId),
    getNextPageParam: lastPage => {
      if (!lastPage || typeof lastPage.total !== 'number') return undefined;
      const { page, limit, total } = lastPage;
      return page * limit < total ? page + 1 : undefined;
    },
    enabled: !!vendorId,
    initialPageParam: 1,
  });

  const invalidateVendorProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['vendorProducts', vendorId] });
  }, [queryClient, vendorId]);

  useEffect(() => {
    if (!socket || !vendorId) return;
    const events = ['PRODUCT_UPDATED', 'STOCK_UPDATED'];
    events.forEach(e => socket.on(e, invalidateVendorProducts));
    return () => { events.forEach(e => socket.off(e, invalidateVendorProducts)); };
  }, [socket, vendorId, invalidateVendorProducts]);

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock, weight }: { id: string; stock?: number; weight?: number }) =>
      ProductService.updateStock(id, stock, weight),
    onSuccess: () => {
      invalidateVendorProducts();
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
      invalidateVendorProducts();
      Toast.show({ type: 'success', text1: t('common.save'), text2: t('inventory.price_updated') });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: t('common.error'), text2: error.message });
    },
  });

  const bulkAddProductsMutation = useMutation({
    mutationFn: (items: BulkAddVendorProductsFromGlobalItem[]) => ProductService.bulkAddProductsFromGlobal(vendorId!, items),
    onSuccess: (data) => {
      invalidateVendorProducts();
      Toast.show({
        type: 'success',
        text1: t('common.save'),
        text2: `${data?.added ?? 0} ${t('products.bulk_added_count')}, ${data?.skipped ?? 0} ${t('products.bulk_skipped_count')}`,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || t('products.bulk_add_failed'),
      });
    },
  });

  const bulkAddProductsFromCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => ProductService.bulkAddProductsFromCategory(vendorId!, categoryId),
    onSuccess: (data) => {
      invalidateVendorProducts();
      Toast.show({
        type: 'success',
        text1: t('common.save'),
        text2: `${data?.added ?? 0} ${t('products.bulk_added_count')}, ${data?.skipped ?? 0} ${t('products.bulk_skipped_count')}`,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || t('products.bulk_add_failed'),
      });
    },
  });

  return {
    categories: categoriesData || [],
    globalCategories: globalCategoriesData || [],
    globalProducts: globalProductsData?.data || [],
    globalProductsTotal: globalProductsData?.total || 0,
    products: vendorProductsData?.pages.flatMap(p => p?.data ?? []) ?? [],
    productsTotal: vendorProductsData?.pages[0]?.total || 0,
    isLoading: categoriesLoading || vendorProductsLoading,
    isGlobalProductsLoading: globalProductsLoading,
    refetch: refetchVendorProducts,
    isRefetching: isRefetchingVendorProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    updateStock: updateStockMutation.mutate,
    isUpdatingStock: updateStockMutation.isPending,
    updatePrice: updatePriceMutation.mutate,
    isUpdatingPrice: updatePriceMutation.isPending,
    bulkAddProductsFromGlobal: bulkAddProductsMutation.mutateAsync,
    isBulkAddingProducts: bulkAddProductsMutation.isPending,
    bulkAddProductsFromCategory: bulkAddProductsFromCategoryMutation.mutateAsync,
    isBulkAddingFromCategory: bulkAddProductsFromCategoryMutation.isPending,
  };
};

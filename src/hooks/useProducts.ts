import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useSocket } from '../app/SocketContext';
import { ProductService } from '../services/api/productService';
import { useAuth } from '../app/AuthContext';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export const useProducts = (globalProductSearch?: string) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { t } = useTranslation();

  const { vendor } = useAuth();
  const vendorId = vendor?.id;

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['vendorProducts', vendorId],
    queryFn: ({ pageParam = 1 }) => ProductService.getVendorProducts(vendorId!, pageParam, 20),
    getNextPageParam: (lastPage) => {
      if (!lastPage || typeof lastPage.total !== 'number') return undefined;
      const { page, limit, total } = lastPage;
      if (page * limit < total) return page + 1;
      return undefined;
    },
    enabled: !!vendorId,
    initialPageParam: 1,
  });

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['vendorCategories', vendorId],
    queryFn: () => ProductService.getVendorCategories(vendorId!),
    enabled: !!vendorId,
  });

  const {
    data: globalCategoriesData,
    isLoading: globalCategoriesLoading,
  } = useQuery({
    queryKey: ['globalCategories'],
    queryFn: () => ProductService.getGlobalCategories(),
  });

  const {
    data: globalProductsData,
    isLoading: globalProductsLoading,
  } = useQuery({
    queryKey: ['globalProducts', globalProductSearch],
    queryFn: () => ProductService.getGlobalProducts(1, 100, globalProductSearch),
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => ProductService.createVendorProduct({ ...data, vendorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts', vendorId] });
      Toast.show({
        type: 'success',
        text1: t('common.save'),
        text2: t('inventory.product_created', 'Product created successfully'),
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || 'Failed to create product',
      });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock, weight }: { id: string; stock?: number; weight?: number }) =>
      ProductService.updateStock(id, stock, weight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts', vendorId] });
      Toast.show({
        type: 'success',
        text1: t('common.save'),
        text2: t('inventory.stock_updated'),
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || 'Failed to update stock',
      });
    }
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      ProductService.updatePrice(id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts', vendorId] });
      Toast.show({
        type: 'success',
        text1: t('common.save'),
        text2: t('inventory.price_updated'),
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || 'Failed to update price',
      });
    },
  });

  useEffect(() => {
    if (!socket || !vendorId) return;

    const handleProductUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts', vendorId] });
    };

    const events = ['PRODUCT_UPDATED', 'STOCK_UPDATED'];

    events.forEach(event => socket.on(event, handleProductUpdate));

    return () => {
      events.forEach(event => socket.off(event, handleProductUpdate));
    };
  }, [socket, vendorId, queryClient]);

  const products = useMemo(() => productsData?.pages.flatMap(page => page?.data || []) || [], [productsData]);
  const categories = useMemo(() => categoriesData || [], [categoriesData]);
  const globalCategories = useMemo(() => globalCategoriesData || [], [globalCategoriesData]);
  const globalProducts = useMemo(() => globalProductsData?.data || [], [globalProductsData]);

  const isLoading = productsLoading || categoriesLoading || globalCategoriesLoading;
  const error = productsError || categoriesError;

  return {
    products,
    categories,
    globalCategories,
    globalProducts,
    isLoading,
    isGlobalProductsLoading: globalProductsLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createProduct: createProductMutation.mutate,
    isCreatingProduct: createProductMutation.isPending,
    updateStock: updateStockMutation.mutate,
    isUpdatingStock: updateStockMutation.isPending,
    updatePrice: updatePriceMutation.mutate,
    isUpdatingPrice: updatePriceMutation.isPending,
  };
};

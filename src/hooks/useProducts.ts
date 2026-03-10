import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../app/SocketContext';
import { ProductService } from '../services/api/productService';
import { useAuth } from '../app/AuthContext';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export const useProducts = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { t } = useTranslation();

  const { vendor } = useAuth();
  const vendorId = vendor?.id;

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['vendorProducts', vendorId],
    queryFn: () => ProductService.getVendorProducts(vendorId!),
    enabled: !!vendorId,
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

  const products = useMemo(() => productsData?.data || [], [productsData]);
  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  const isLoading = productsLoading || categoriesLoading;
  const error = productsError || categoriesError;

  return { 
    products, 
    categories, 
    isLoading, 
    error,
    updateStock: updateStockMutation.mutate,
    isUpdatingStock: updateStockMutation.isPending
  };
};

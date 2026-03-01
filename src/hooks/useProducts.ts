import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../app/SocketContext';
import { ProductService } from '../services/api/productService';
import { useAuth } from '../app/AuthContext';

export const useProducts = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

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

  useEffect(() => {
    if (!socket || !vendorId) return;

    const handleProductUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts', vendorId] });
    };

    // We can add more events here as the backend evolves
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

  return { products, categories, isLoading, error };
};

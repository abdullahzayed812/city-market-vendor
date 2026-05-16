import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '../services/api/productService';
import { useAuth } from '../app/AuthContext';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export const useProducts = (globalProductSearch?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { vendor } = useAuth();
  const vendorId = vendor?.id;

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['vendorCategories', vendorId],
    queryFn: () => ProductService.getVendorCategories(vendorId!),
    enabled: !!vendorId,
  });

  const { data: globalProductsData, isLoading: globalProductsLoading } = useQuery({
    queryKey: ['globalProducts', globalProductSearch],
    queryFn: () => ProductService.getGlobalProducts(1, 100, globalProductSearch),
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => ProductService.createVendorProduct({ ...data, vendorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorCategoryProducts', vendorId] });
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

  return {
    categories: categoriesData || [],
    globalProducts: globalProductsData?.data || [],
    isLoading: categoriesLoading,
    isGlobalProductsLoading: globalProductsLoading,
    createProduct: createProductMutation.mutate,
    isCreatingProduct: createProductMutation.isPending,
  };
};

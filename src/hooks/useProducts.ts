import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '../services/api/productService';
import { useAuth } from '../app/AuthContext';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import type { BulkAddVendorProductsFromGlobalItem } from '@city-market/shared';

export const useProducts = (globalProductSearch?: string, globalCategoryId?: string) => {
  const queryClient = useQueryClient();
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

  const bulkAddProductsMutation = useMutation({
    mutationFn: (items: BulkAddVendorProductsFromGlobalItem[]) => ProductService.bulkAddProductsFromGlobal(vendorId!, items),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendorCategoryProducts', vendorId] });
      Toast.show({
        type: 'success',
        text1: t('common.save'),
        text2: `${data?.added ?? 0} ${t('products.bulk_added_count', 'added')}, ${data?.skipped ?? 0} ${t('products.bulk_skipped_count', 'skipped')}`,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || 'Failed to add products',
      });
    },
  });

  const bulkAddProductsFromCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => ProductService.bulkAddProductsFromCategory(vendorId!, categoryId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendorCategoryProducts', vendorId] });
      Toast.show({
        type: 'success',
        text1: t('common.save'),
        text2: `${data?.added ?? 0} ${t('products.bulk_added_count', 'added')}, ${data?.skipped ?? 0} ${t('products.bulk_skipped_count', 'skipped')}`,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || 'Failed to add products',
      });
    },
  });

  return {
    categories: categoriesData || [],
    globalCategories: globalCategoriesData || [],
    globalProducts: globalProductsData?.data || [],
    globalProductsTotal: globalProductsData?.total || 0,
    isLoading: categoriesLoading,
    isGlobalProductsLoading: globalProductsLoading,
    bulkAddProductsFromGlobal: bulkAddProductsMutation.mutateAsync,
    isBulkAddingProducts: bulkAddProductsMutation.isPending,
    bulkAddProductsFromCategory: bulkAddProductsFromCategoryMutation.mutateAsync,
    isBulkAddingFromCategory: bulkAddProductsFromCategoryMutation.isPending,
  };
};

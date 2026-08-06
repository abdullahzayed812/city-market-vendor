import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from './useProducts';

export const useProductsLogic = () => {
  const { t } = useTranslation();
  const [globalSearchStr, setGlobalSearchStr] = useState('');
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState('');
  const [globalCategoryFilter, setGlobalCategoryFilter] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (globalSearchStr.length === 0 || globalSearchStr.length >= 3) {
        setDebouncedGlobalSearch(globalSearchStr);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [globalSearchStr]);

  const {
    categories,
    globalCategories,
    globalProducts,
    globalProductsTotal,
    products,
    isLoading,
    isGlobalProductsLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    updateStock,
    isUpdatingStock,
    updatePrice,
    isUpdatingPrice,
    bulkAddProductsFromGlobal,
    isBulkAddingProducts,
    bulkAddProductsFromCategory,
    isBulkAddingFromCategory,
  } = useProducts(debouncedGlobalSearch, globalCategoryFilter || undefined, selectedCategoryId);

  const [bulkAddModalVisible, setBulkAddModalVisible] = useState(false);

  const openBulkAddModal = useCallback(() => {
    setBulkAddModalVisible(true);
  }, []);

  return {
    t,
    categories,
    globalCategories,
    globalProducts,
    globalProductsTotal,
    products,
    isLoading,
    isGlobalProductsLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    selectedCategoryId,
    setSelectedCategoryId,
    setGlobalSearchStr,
    globalCategoryFilter,
    setGlobalCategoryFilter,
    bulkAddModalVisible,
    setBulkAddModalVisible,
    openBulkAddModal,
    bulkAddProductsFromGlobal,
    isBulkAddingProducts,
    bulkAddProductsFromCategory,
    isBulkAddingFromCategory,
    updateStock,
    isUpdatingStock,
    updatePrice,
    isUpdatingPrice,
  };
};

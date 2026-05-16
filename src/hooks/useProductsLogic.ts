import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from './useProducts';

export const useProductsLogic = () => {
  const { t } = useTranslation();
  const [globalSearchStr, setGlobalSearchStr] = useState('');
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState('');

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
    globalProducts,
    isLoading,
    isGlobalProductsLoading,
    createProduct,
    isCreatingProduct,
  } = useProducts(debouncedGlobalSearch);

  const [addProductModalVisible, setAddProductModalVisible] = useState(false);

  const handleAddProduct = useCallback(async (data: any) => {
    await createProduct(data);
    setAddProductModalVisible(false);
  }, [createProduct]);

  const openAddProductModal = useCallback(() => {
    setAddProductModalVisible(true);
  }, []);

  return {
    t,
    categories,
    globalProducts,
    isLoading,
    isGlobalProductsLoading,
    addProductModalVisible,
    setAddProductModalVisible,
    handleAddProduct,
    isCreatingProduct,
    openAddProductModal,
    setGlobalSearchStr,
  };
};

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from './useProducts';
import { VendorProduct } from '@city-market/shared';

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
    products,
    isLoading,
    updateStock,
    isUpdatingStock,
    updatePrice,
    isUpdatingPrice,
    categories,
    globalCategories,
    globalProducts,
    createProduct,
    isCreatingProduct,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isGlobalProductsLoading,
  } = useProducts(debouncedGlobalSearch);

  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);

  const sections = useMemo(() => {
    if (!products || !categories) return [];

    return categories.map(cat => ({
      title: cat.name,
      id: cat.id,
      data: products
        .filter(p => p.vendorCategoryId === cat.id)
        .reduce((acc: any[][], curr, i) => {
          if (i % 2 === 0) acc.push([curr]);
          else acc[acc.length - 1].push(curr);
          return acc;
        }, []),
    })).filter(section => section.data.length > 0);
  }, [products, categories]);

  const handleUpdateStock = useCallback(async (id: string, quantity?: number, weightGrams?: number) => {
    await updateStock({ id, stock: quantity, weight: weightGrams });
    setStockModalVisible(false);
  }, [updateStock]);

  const handleUpdatePrice = useCallback(async (id: string, price: number) => {
    await updatePrice({ id, price });
    setPriceModalVisible(false);
  }, [updatePrice]);

  const handleAddProduct = useCallback(async (data: any) => {
    await createProduct(data);
    setAddProductModalVisible(false);
  }, [createProduct]);

  const openOptions = useCallback((product: VendorProduct) => {
    setSelectedProduct(product);
    setOptionsModalVisible(true);
  }, []);

  const openStockModal = useCallback((product: VendorProduct) => {
    setSelectedProduct(product);
    setStockModalVisible(true);
  }, []);

  const openPriceModal = useCallback((product: VendorProduct) => {
    setSelectedProduct(product);
    setPriceModalVisible(true);
  }, []);

  const openAddProductModal = useCallback(() => {
    setAddProductModalVisible(true);
  }, []);

  return {
    t,
    products,
    categories,
    globalCategories,
    globalProducts,
    isLoading,
    sections,
    stockModalVisible,
    setStockModalVisible,
    priceModalVisible,
    setPriceModalVisible,
    optionsModalVisible,
    setOptionsModalVisible,
    addProductModalVisible,
    setAddProductModalVisible,
    selectedProduct,
    handleUpdateStock,
    isUpdatingStock,
    handleUpdatePrice,
    isUpdatingPrice,
    handleAddProduct,
    isCreatingProduct,
    openOptions,
    openStockModal,
    openPriceModal,
    openAddProductModal,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    setGlobalSearchStr,
    isGlobalProductsLoading,
  };
};

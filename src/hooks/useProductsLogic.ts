import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from './useProducts';
import { VendorProduct } from '@city-market/shared';

export const useProductsLogic = () => {
  const { t } = useTranslation();
  const {
    products,
    isLoading,
    updateStock,
    isUpdatingStock,
    updatePrice,
    isUpdatingPrice,
    categories,
    isLoadingCategories,
  } = useProducts();

  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
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
    await updateStock({ id, quantity, weightGrams });
    setStockModalVisible(false);
  }, [updateStock]);

  const handleUpdatePrice = useCallback(async (id: string, price: number) => {
    await updatePrice({ id, price });
    setPriceModalVisible(false);
  }, [updatePrice]);

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

  return {
    t,
    products,
    isLoading: isLoading || isLoadingCategories,
    sections,
    stockModalVisible,
    setStockModalVisible,
    priceModalVisible,
    setPriceModalVisible,
    optionsModalVisible,
    setOptionsModalVisible,
    selectedProduct,
    handleUpdateStock,
    isUpdatingStock,
    handleUpdatePrice,
    isUpdatingPrice,
    openOptions,
    openStockModal,
    openPriceModal,
  };
};

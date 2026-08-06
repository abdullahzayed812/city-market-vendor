import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { AppText as Text } from '@city-market/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Package, MoreVertical, X, Save, ClipboardList, Tag, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import CustomHeader from '../components/common/CustomHeader';
import ImageWithPlaceholder from '../components/common/ImageWithPlaceholder';
import { MeasurementType, VendorProduct, WeightUnit } from '@city-market/shared';
import { useProductsLogic } from '../hooks/useProductsLogic';
import BulkAddProductsModal from '../components/BulkAddProductsModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

const LOW_STOCK_THRESHOLD_UNITS = 10;
const LOW_STOCK_THRESHOLD_GRAMS = 1000;

const CategoryTabs = React.memo(({ t, categories, selectedCategoryId, onSelect }: any) => {
  const data = [{ id: undefined, name: t('common.all') }, ...categories];

  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={item => item.id ?? 'all'}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabsList}
      renderItem={({ item }) => {
        const isSelected = selectedCategoryId === item.id;
        return (
          <TouchableOpacity
            style={[styles.categoryTab, isSelected && styles.categoryTabSelected]}
            activeOpacity={0.8}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[styles.categoryTabText, isSelected && styles.categoryTabTextSelected]} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
});

const StockUpdateModal = React.memo(
  ({ visible, product, onClose, onSave, isUpdating }: any) => {
    const { t } = useTranslation();
    const isWeight = product?.measurementType === MeasurementType.WEIGHT;

    let initialValue = product?.stockQuantity?.toString() || '0';
    let unitLabel = t('inventory.unit');

    if (isWeight) {
      const grams = product?.stockWeightGrams || 0;
      if (product?.weightUnit === WeightUnit.KG) {
        initialValue = (grams / 1000).toString();
        unitLabel = t('inventory.units.kg');
      } else {
        initialValue = grams.toString();
        unitLabel = t('inventory.units.gram');
      }
    }

    const [value, setValue] = useState(initialValue);

    React.useEffect(() => {
      setValue(initialValue);
    }, [initialValue, visible]);

    const handleSave = () => {
      const numValue = parseFloat(value) || 0;
      if (isWeight) {
        const grams = product.weightUnit === WeightUnit.KG ? numValue * 1000 : numValue;
        onSave(product.id, undefined, grams);
      } else {
        onSave(product.id, Math.round(numValue), undefined);
      }
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('inventory.update_stock')}</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.productLabel}>{product?.name}</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('inventory.new_stock')}</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.numericInput}
                      value={value}
                      onChangeText={setValue}
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                    <Text style={styles.unitText}>{unitLabel}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, isUpdating && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <>
                    <Save size={20} color={theme.colors.white} />
                    <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  },
);

const PriceUpdateModal = React.memo(
  ({ visible, product, onClose, onSave, isUpdating }: any) => {
    const { t } = useTranslation();
    const [value, setValue] = useState(product?.price?.toString() || '0');

    React.useEffect(() => {
      setValue(product?.price?.toString() || '0');
    }, [product, visible]);

    const handleSave = () => {
      onSave(product.id, parseFloat(value) || 0);
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('inventory.update_price')}</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.productLabel}>{product?.name}</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('inventory.new_price')}</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.numericInput}
                      value={value}
                      onChangeText={setValue}
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                    <Text style={styles.unitText}>{t('common.currency')}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, isUpdating && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <>
                    <Save size={20} color={theme.colors.white} />
                    <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

const ProductOptionsModal = React.memo(
  ({ visible, product, onClose, onUpdateStock, onUpdatePrice }: any) => {
    const { t } = useTranslation();

    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.optionsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('common.select_action')}</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.productLabel}>{product?.name}</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => { onClose(); onUpdateStock(product); }}
              >
                <View style={[styles.optionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                  <ClipboardList size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.optionText}>{t('inventory.update_stock')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => { onClose(); onUpdatePrice(product); }}
              >
                <View style={[styles.optionIcon, { backgroundColor: theme.colors.info + '15' }]}>
                  <Tag size={22} color={theme.colors.info} />
                </View>
                <Text style={styles.optionText}>{t('inventory.update_price')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  },
);

const ProductCard = React.memo(({ item, onOpenOptions, t }: any) => {
  const isWeight = item.measurementType === MeasurementType.WEIGHT;
  const stock = isWeight
    ? `${(item.stockWeightGrams / 1000).toFixed(1)} ${t('inventory.units.kg')}`
    : item.stockQuantity;

  const isLowStock = isWeight
    ? item.stockWeightGrams <= LOW_STOCK_THRESHOLD_GRAMS
    : item.stockQuantity <= LOW_STOCK_THRESHOLD_UNITS;
  const hasStock = isWeight ? item.stockWeightGrams > 0 : item.stockQuantity > 0;

  return (
    <TouchableOpacity style={styles.productCard} onPress={() => onOpenOptions(item)} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <ImageWithPlaceholder uri={item.imageUrl || null} style={styles.productImage} />
        <View
          style={[
            styles.stockBadge,
            {
              backgroundColor: !hasStock
                ? theme.colors.error
                : isLowStock
                  ? theme.colors.warning
                  : theme.colors.success,
            },
          ]}
        >
          <Text style={styles.stockBadgeText}>
            {stock} {isLowStock && hasStock ? `(${t('inventory.low_stock')})` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.measurementText}>{isWeight ? t('inventory.per_kg') : t('inventory.per_unit')}</Text>
          <Text style={styles.productPrice}>
            {t('common.currency')} {item.price.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={() => onOpenOptions(item)}>
          <MoreVertical size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const ProductsScreen = () => {
  const {
    t,
    categories,
    globalCategories,
    globalProducts,
    globalProductsTotal,
    isGlobalProductsLoading,
    setGlobalSearchStr,
    globalCategoryFilter,
    setGlobalCategoryFilter,
    products,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    selectedCategoryId,
    setSelectedCategoryId,
    updateStock,
    isUpdatingStock,
    updatePrice,
    isUpdatingPrice,
    bulkAddModalVisible,
    setBulkAddModalVisible,
    openBulkAddModal,
    bulkAddProductsFromGlobal,
    isBulkAddingProducts,
    bulkAddProductsFromCategory,
    isBulkAddingFromCategory,
  } = useProductsLogic();

  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);

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

  const handleUpdateStock = useCallback(
    (id: string, quantity?: number, weightGrams?: number) => {
      updateStock({ id, stock: quantity, weight: weightGrams });
      setStockModalVisible(false);
    },
    [updateStock],
  );

  const handleUpdatePrice = useCallback(
    (id: string, price: number) => {
      updatePrice({ id, price });
      setPriceModalVisible(false);
    },
    [updatePrice],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title={t('products.title')} />

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />
        }
        ListHeaderComponent={
          categories.length > 0 ? (
            <CategoryTabs
              t={t}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ProductCard item={item} onOpenOptions={openOptions} t={t} />
        )}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator style={styles.footerLoader} color={theme.colors.primary} />
            : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={80} color={theme.colors.border} />
            <Text style={styles.emptyText}>{t('products.no_products')}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openBulkAddModal}>
        <Plus size={30} color={theme.colors.white} />
      </TouchableOpacity>

      <ProductOptionsModal
        visible={optionsModalVisible}
        product={selectedProduct}
        onClose={() => setOptionsModalVisible(false)}
        onUpdateStock={openStockModal}
        onUpdatePrice={openPriceModal}
      />
      <StockUpdateModal
        visible={stockModalVisible}
        product={selectedProduct}
        onClose={() => setStockModalVisible(false)}
        onSave={handleUpdateStock}
        isUpdating={isUpdatingStock}
      />
      <PriceUpdateModal
        visible={priceModalVisible}
        product={selectedProduct}
        onClose={() => setPriceModalVisible(false)}
        onSave={handleUpdatePrice}
        isUpdating={isUpdatingPrice}
      />
      <BulkAddProductsModal
        visible={bulkAddModalVisible}
        onClose={() => setBulkAddModalVisible(false)}
        globalProducts={globalProducts}
        globalProductsTotal={globalProductsTotal}
        isGlobalProductsLoading={isGlobalProductsLoading}
        onSearchChange={setGlobalSearchStr}
        onSubmit={bulkAddProductsFromGlobal}
        isSubmitting={isBulkAddingProducts}
        globalCategories={globalCategories}
        globalCategoryFilter={globalCategoryFilter}
        onCategoryFilterChange={setGlobalCategoryFilter}
        onImportCategory={bulkAddProductsFromCategory}
        isImportingCategory={isBulkAddingFromCategory}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: theme.spacing.lg, paddingBottom: 100 },
  row: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  footerLoader: { paddingVertical: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: theme.colors.textMuted },

  categoryTabsList: {
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  categoryTab: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 9,
  },
  categoryTabSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textMuted,
  },
  categoryTabTextSelected: {
    color: theme.colors.white,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },

  // Product card
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    ...theme.shadows.card,
    overflow: 'hidden',
  },
  imageContainer: { width: '100%', height: CARD_WIDTH },
  productImage: { width: '100%', height: '100%' },
  stockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  stockBadgeText: { color: theme.colors.white, fontSize: 10, fontWeight: 'bold' },
  productInfo: { padding: 12 },
  productName: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
    marginBottom: 4,
    paddingRight: 20,
  },
  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  productPrice: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  measurementText: { fontSize: 10, color: theme.colors.textMuted, marginStart: 4 },
  moreBtn: { position: 'absolute', top: 10, right: 8 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { width: '100%' },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  optionsModalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  modalBody: { marginBottom: 24 },
  productLabel: { fontSize: 16, color: theme.colors.textMuted, marginBottom: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    height: 60,
  },
  numericInput: { flex: 1, fontSize: 24, fontWeight: 'bold', color: theme.colors.primary },
  unitText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textMuted },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: theme.colors.white, fontSize: 18, fontWeight: 'bold', marginStart: 10 },
  optionsContainer: { gap: 16 },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: theme.radius.xl,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
});

export default ProductsScreen;

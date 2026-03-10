import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package, MoreVertical, Plus, X, Save } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '../hooks/useProducts';
import { theme } from '../theme';
import CustomHeader from '../components/common/CustomHeader';
import { getBaseURL } from '../services/api/config';
import ImageWithPlaceholder from '../components/common/ImageWithPlaceholder';
import {
  MeasurementType,
  VendorProduct,
  WeightUnit,
} from '@city-market/shared';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

const StockUpdateModal = ({
  visible,
  product,
  onClose,
  onSave,
  isUpdating,
}: any) => {
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
      const grams =
        product.weightUnit === WeightUnit.KG ? numValue * 1000 : numValue;
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
              <Text style={styles.modalTitle}>
                {t('inventory.update_stock')}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.productLabel}>{product?.name}</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t('inventory.new_stock')}
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.stockInput}
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
};

// Separate Product Card Component for better performance
const ProductCard = React.memo(({ item, onUpdateStock }: any) => {
  const { t } = useTranslation();
  const isWeight = item.measurementType === MeasurementType.WEIGHT;

  let displayStock = item.stockQuantity.toString();
  let unitLabel = ''; // Default for unit-based is empty or 'Unit'

  if (isWeight) {
    const grams = item.stockWeightGrams || 0;
    if (item.weightUnit === WeightUnit.KG) {
      displayStock = (grams / 1000).toFixed(1);
      unitLabel = t('inventory.units.kg');
    } else {
      displayStock = grams.toString();
      unitLabel = t('inventory.units.gram');
    }
  }

  const isLow = isWeight
    ? (item.stockWeightGrams || 0) < 5000
    : item.stockQuantity < 10;

  return (
    <View style={styles.productCardWrapper}>
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => onUpdateStock(item)}
        activeOpacity={0.9}
      >
        <View style={styles.imageWrapper}>
          <ImageWithPlaceholder
            uri={item.imageUrl ? `${getBaseURL()}${item.imageUrl}` : null}
            style={styles.productImage}
          />
          {/* <TouchableOpacity style={styles.moreBtn}>
            <MoreVertical size={16} color={theme.colors.white} />
          </TouchableOpacity> */}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            <View
              style={[
                styles.stockBadge,
                {
                  backgroundColor: isLow
                    ? 'rgba(255, 59, 48, 0.1)'
                    : 'rgba(79, 82, 64, 0.05)',
                },
              ]}
            >
              <Text
                style={[
                  styles.stockText,
                  {
                    color: isLow ? theme.colors.error : theme.colors.primary,
                  },
                ]}
              >
                {displayStock} {unitLabel}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const ProductsScreen = () => {
  const { t } = useTranslation();
  const { products, categories, isLoading, updateStock, isUpdatingStock } =
    useProducts();
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Chunk products into pairs for grid layout
  const sections = useMemo(() => {
    if (!products || !categories) return [];

    return categories
      .map(cat => {
        const catProducts = products.filter(p => p.vendorCategoryId === cat.id);
        const chunkedProducts = [];
        for (let i = 0; i < catProducts.length; i += 2) {
          chunkedProducts.push(catProducts.slice(i, i + 2));
        }
        return {
          title: cat.name,
          id: cat.id,
          data: chunkedProducts,
        };
      })
      .filter(section => section.data.length > 0);
  }, [products, categories]);

  const handleUpdateStockPress = useCallback((product: any) => {
    setSelectedProduct(product);
    setModalVisible(true);
  }, []);

  const handleSaveStock = useCallback(
    (id: string, stock?: number, weight?: number) => {
      updateStock(
        { id, stock, weight },
        {
          onSuccess: () => setModalVisible(false),
        },
      );
    },
    [updateStock],
  );

  const renderRow = useCallback(
    ({ item }: { item: any[] }) => (
      <View style={styles.row}>
        {item.map(product => (
          <ProductCard
            key={product.id}
            item={product}
            onUpdateStock={handleUpdateStockPress}
          />
        ))}
        {item.length === 1 && <View style={styles.productCardWrapper} />}
      </View>
    ),
    [handleUpdateStockPress],
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
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title={t('products.title')}
        rightComponent={
          <TouchableOpacity style={styles.headerAddBtn}>
            <Plus size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item[0].id + index}
        renderItem={renderRow}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={80} color={theme.colors.border} />
            <Text style={styles.emptyText}>{t('products.no_products')}</Text>
          </View>
        }
      />

      <StockUpdateModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveStock}
        isUpdating={isUpdatingStock}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerAddBtn: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: theme.spacing.md,
  },
  productCardWrapper: {
    width: CARD_WIDTH,
  },
  productCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.card,
    height: 210,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  imageWrapper: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  moreBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.success,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: theme.colors.textMuted },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    ...theme.shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.secondary,
  },
  modalBody: {
    marginBottom: 24,
  },
  productLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.secondary,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  stockInput: {
    flex: 1,
    height: 50,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default ProductsScreen;

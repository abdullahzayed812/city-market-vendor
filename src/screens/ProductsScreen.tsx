import React, { useState, useMemo, useCallback } from 'react';
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
  ScrollView,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Plus,
  X,
  Save,
  MoreVertical,
  ClipboardList,
  Tag,
  Search,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import CustomHeader from '../components/common/CustomHeader';
import { getBaseURL } from '../services/api/config';
import ImageWithPlaceholder from '../components/common/ImageWithPlaceholder';
import {
  MeasurementType,
  VendorProduct,
  WeightUnit,
} from '@city-market/shared';
import { useProductsLogic } from '../hooks/useProductsLogic';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

const LOW_STOCK_THRESHOLD_UNITS = 10;
const LOW_STOCK_THRESHOLD_GRAMS = 1000;

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
      const numValue = parseFloat(value) || 0;
      onSave(product.id, numValue);
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('inventory.update_price')}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.productLabel}>{product?.name}</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('inventory.new_price')}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.stockInput}
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

const SelectionModal = React.memo(
  ({
    visible,
    title,
    data,
    onSelect,
    onClose,
    t,
    onSearchChange,
    isLoading,
  }: any) => {
    const [search, setSearch] = useState('');

    const filteredData = useMemo(() => {
      if (!search) return data;
      return data.filter((item: any) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );
    }, [data, search]);

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={theme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('common.search', 'Search...')}
                value={search}
                onChangeText={text => {
                  setSearch(text);
                  onSearchChange?.(text);
                }}
                autoFocus={false}
              />
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => onSelect(item)}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyPickerContainer}>
                  <Text style={styles.emptyText}>
                    {t('common.no_results', 'No results found')}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  },
);

const AddProductModal = React.memo(
  ({
    visible,
    onClose,
    onSave,
    isCreating,
    globalProducts,
    categories,
    t,
    onGlobalSearchChange,
    isGlobalProductsLoading,
  }: any) => {
    const [formData, setFormData] = useState<any>({
      name: '',
      description: '',
      price: '',
      stock: '',
      globalCategoryId: '',
      vendorCategoryId: '',
      globalProductId: '',
      measurementType: MeasurementType.UNIT,
    });

    const [showGlobalPicker, setShowGlobalPicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    React.useEffect(() => {
      if (visible) {
        setFormData({
          name: '',
          description: '',
          price: '',
          stock: '',
          globalCategoryId: '',
          vendorCategoryId: '',
          globalProductId: '',
          measurementType: MeasurementType.UNIT,
        });
        setShowGlobalPicker(false);
        setShowCategoryPicker(false);
      }
    }, [visible]);

    const handleGlobalSelect = (product: any) => {
      setFormData({
        ...formData,
        globalProductId: product.id,
        name: product.name,
        description: product.description || '',
        globalCategoryId: product.globalCategoryId,
        measurementType: product.measurementType || MeasurementType.UNIT,
      });
      setShowGlobalPicker(false);
    };

    const handleSave = () => {
      if (
        !formData.globalProductId ||
        !formData.vendorCategoryId ||
        !formData.price
      ) {
        return;
      }

      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        globalProductId: formData.globalProductId,
        globalCategoryId: formData.globalCategoryId,
        vendorCategoryId: formData.vendorCategoryId,
      };

      const stockNum = parseInt(formData.stock) || 0;
      if (formData.measurementType === MeasurementType.WEIGHT) {
        payload.stockWeightGrams = stockNum;
      } else {
        payload.stockQuantity = stockNum;
      }

      onSave(payload);
    };

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { height: '95%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('products.add_product')}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }}>
                <FlatList
                  data={(showGlobalPicker && !formData.globalProductId) ? globalProducts : []}
                  keyExtractor={(p: any) => p.id}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 20 }}
                  ListHeaderComponent={
                    <View style={styles.modalBody}>
                      <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                        <Text style={styles.inputLabel}>
                          {t('products.link_to_global')}
                          {isGlobalProductsLoading && (
                            <Text style={{ fontSize: 12, color: theme.colors.primary }}>
                              {' '}(Loading...)
                            </Text>
                          )}
                        </Text>
                        <View style={{ position: 'relative', zIndex: 1000 }}>
                          <TextInput
                            style={[
                              styles.stockInput,
                              {
                                backgroundColor: theme.colors.surface,
                                borderWidth: 1,
                                borderColor: showGlobalPicker ? theme.colors.primary : theme.colors.border,
                                padding: 12,
                                borderRadius: 8,
                                fontSize: 16,
                              },
                            ]}
                            placeholder={t('products.search_global_placeholder', 'Search global catalog...')}
                            value={formData.name}
                            onChangeText={text => {
                              setFormData({ ...formData, name: text, globalProductId: '' });
                              onGlobalSearchChange?.(text);
                              setShowGlobalPicker(true);
                            }}
                            onFocus={() => setShowGlobalPicker(true)}
                            onBlur={() => {
                              setTimeout(() => setShowGlobalPicker(false), 200);
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  }
                  renderItem={({ item: p }: any) => (
                    <TouchableOpacity
                      style={{
                        padding: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      }}
                      onPress={() => {
                        handleGlobalSelect(p);
                        setShowGlobalPicker(false);
                      }}
                    >
                      <Text style={{ fontSize: 16, color: theme.colors.text }}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListFooterComponent={
                    <View style={[styles.modalBody, { paddingTop: 0 }]}>
                      {/* Vendor Category Selection */}
                      <View style={[styles.inputGroup, { zIndex: 900, marginTop: theme.spacing.md }]}>
                        <Text style={styles.inputLabel}>{t('products.store_category')}</Text>
                        <TouchableOpacity
                          style={styles.pickerTrigger}
                          onPress={() => setShowCategoryPicker(true)}
                        >
                          <Text
                            style={[
                              styles.pickerValue,
                              !formData.vendorCategoryId && { color: theme.colors.textLight },
                            ]}
                          >
                            {categories.find((c: any) => c.id === formData.vendorCategoryId)?.name ||
                              t('products.select_store_category')}
                          </Text>
                        </TouchableOpacity>
                        <SelectionModal
                          visible={showCategoryPicker}
                          title={t('products.select_store_category')}
                          data={categories}
                          onSelect={(item: any) => {
                            setFormData({ ...formData, vendorCategoryId: item.id });
                            setShowCategoryPicker(false);
                          }}
                          onClose={() => setShowCategoryPicker(false)}
                          t={t}
                        />
                      </View>

                      {/* Price */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          {formData.measurementType === MeasurementType.WEIGHT
                            ? t('products.price_per_kg')
                            : t('products.price')}
                        </Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.stockInput}
                            value={formData.price}
                            onChangeText={val => setFormData({ ...formData, price: val })}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                          />
                          <Text style={styles.unitText}>{t('common.currency')}</Text>
                        </View>
                      </View>

                      {/* Stock */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          {formData.measurementType === MeasurementType.WEIGHT
                            ? t('products.stock_grams')
                            : t('products.stock')}
                        </Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.stockInput}
                            value={formData.stock}
                            onChangeText={val => setFormData({ ...formData, stock: val })}
                            keyboardType="number-pad"
                            placeholder="0"
                          />
                          <Text style={styles.unitText}>
                            {formData.measurementType === MeasurementType.WEIGHT
                              ? t('inventory.units.gram')
                              : t('products.unit')}
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('products.description')}</Text>
                        <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                          <TextInput
                            style={[styles.stockInput, { fontSize: 16, height: '100%' }]}
                            value={formData.description}
                            onChangeText={val => setFormData({ ...formData, description: val })}
                            multiline
                            placeholder={t('products.description')}
                          />
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.saveBtn,
                          { marginTop: theme.spacing.lg },
                          (isCreating || !formData.globalProductId || !formData.vendorCategoryId || !formData.price) && {
                            opacity: 0.7,
                          },
                        ]}
                        onPress={handleSave}
                        disabled={
                          isCreating || !formData.globalProductId || !formData.vendorCategoryId || !formData.price
                        }
                      >
                        {isCreating ? (
                          <ActivityIndicator color={theme.colors.white} size="small" />
                        ) : (
                          <>
                            <Save size={20} color={theme.colors.white} />
                            <Text style={styles.saveBtnText}>{t('products.create_product')}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  }
                />
              </View>
            </View>
          </KeyboardAvoidingView>
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
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
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
                onPress={() => {
                  onClose();
                  onUpdateStock(product);
                }}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: theme.colors.primary + '15' },
                  ]}
                >
                  <ClipboardList size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.optionText}>
                  {t('inventory.update_stock')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  onClose();
                  onUpdatePrice(product);
                }}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: theme.colors.info + '15' },
                  ]}
                >
                  <Tag size={22} color={theme.colors.info} />
                </View>
                <Text style={styles.optionText}>
                  {t('inventory.update_price')}
                </Text>
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
    ? (item.stockWeightGrams / 1000).toFixed(1) + ' kg'
    : item.stockQuantity;

  const isLowStock = isWeight
    ? item.stockWeightGrams <= LOW_STOCK_THRESHOLD_GRAMS
    : item.stockQuantity <= LOW_STOCK_THRESHOLD_UNITS;
  const hasStock = isWeight
    ? item.stockWeightGrams > 0
    : item.stockQuantity > 0;

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onOpenOptions(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <ImageWithPlaceholder
          uri={item.imageUrl ? `${getBaseURL()}${item.imageUrl}` : null}
          style={styles.productImage}
        />
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
            {stock}{' '}
            {isLowStock && hasStock ? `(${t('inventory.low_stock')})` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.measurementText}>
            {isWeight ? ' /kg' : ' /unit'}
          </Text>
          <Text style={styles.productPrice}>
            {t('common.currency')} {item.price.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => onOpenOptions(item)}
        >
          <MoreVertical size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const ProductsScreen = () => {
  const {
    t,
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
    globalProducts,
    categories,
    setGlobalSearchStr,
    isGlobalProductsLoading,
  } = useProductsLogic();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderRow = ({ item }: { item: VendorProduct[] }) => (
    <View style={styles.row}>
      {item.map(product => (
        <ProductCard
          key={product.id}
          item={product}
          onOpenOptions={openOptions}
          t={t}
        />
      ))}
      {item.length === 1 && <View style={styles.emptyCard} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CustomHeader title={t('products.title')} />

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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={80} color={theme.colors.border} />
            <Text style={styles.emptyText}>{t('products.no_products')}</Text>
          </View>
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ marginVertical: 20 }}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddProductModal}>
        <Plus size={30} color={theme.colors.white} />
      </TouchableOpacity>

      <AddProductModal
        visible={addProductModalVisible}
        onClose={() => setAddProductModalVisible(false)}
        onSave={handleAddProduct}
        isCreating={isCreatingProduct}
        globalProducts={globalProducts}
        categories={categories}
        t={t}
        onGlobalSearchChange={setGlobalSearchStr}
        isGlobalProductsLoading={isGlobalProductsLoading}
      />

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 100 },
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    ...theme.shadows.card,
    overflow: 'hidden',
  },
  emptyCard: { width: CARD_WIDTH },
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
  stockBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
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
  measurementText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginStart: 4,
  },
  moreBtn: {
    position: 'absolute',
    top: 10,
    right: 8,
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
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: theme.colors.textMuted },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: { width: '100%' },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    // paddingBottom: Platform.OS === 'ios' ? 40 : 24,
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
  productLabel: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
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
  stockInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  unitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginStart: 10,
  },
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
  pickerTrigger: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    height: 60,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickerValue: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
  pickerDropdown: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
    zIndex: 10,
    overflow: 'hidden',
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerItemText: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginStart: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  emptyPickerContainer: {
    padding: 24,
    alignItems: 'center',
  },
});

export default ProductsScreen;

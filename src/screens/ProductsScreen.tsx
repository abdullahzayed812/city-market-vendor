import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package, Plus, X, Save, ChevronRight, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import CustomHeader from '../components/common/CustomHeader';
import { MeasurementType } from '@city-market/shared';
import { useProductsLogic } from '../hooks/useProductsLogic';

const SelectionModal = React.memo(
  ({ visible, title, data, onSelect, onClose, t, onSearchChange, isLoading }: any) => {
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
              />
              {isLoading && (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />
              )}
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => onSelect(item)}>
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyPickerContainer}>
                  <Text style={styles.emptyText}>{t('common.no_results', 'No results found')}</Text>
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
      if (!formData.globalProductId || !formData.vendorCategoryId || !formData.price) return;

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
                <Text style={styles.modalTitle}>{t('products.add_product')}</Text>
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
                            <Text style={{ fontSize: 12, color: theme.colors.primary }}> (Loading...)</Text>
                          )}
                        </Text>
                        <TextInput
                          style={[
                            styles.textInput,
                            { borderColor: showGlobalPicker ? theme.colors.primary : theme.colors.border },
                          ]}
                          placeholder={t('products.search_global_placeholder', 'Search global catalog...')}
                          value={formData.name}
                          onChangeText={text => {
                            setFormData({ ...formData, name: text, globalProductId: '' });
                            onGlobalSearchChange?.(text);
                            setShowGlobalPicker(true);
                          }}
                          onFocus={() => setShowGlobalPicker(true)}
                          onBlur={() => setTimeout(() => setShowGlobalPicker(false), 200)}
                        />
                      </View>
                    </View>
                  }
                  renderItem={({ item: p }: any) => (
                    <TouchableOpacity
                      style={styles.globalProductItem}
                      onPress={() => { handleGlobalSelect(p); setShowGlobalPicker(false); }}
                    >
                      <Text style={{ fontSize: 16, color: theme.colors.text }}>{p.name}</Text>
                    </TouchableOpacity>
                  )}
                  ListFooterComponent={
                    <View style={[styles.modalBody, { paddingTop: 0 }]}>
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

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          {formData.measurementType === MeasurementType.WEIGHT
                            ? t('products.price_per_kg')
                            : t('products.price')}
                        </Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.numericInput}
                            value={formData.price}
                            onChangeText={val => setFormData({ ...formData, price: val })}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                          />
                          <Text style={styles.unitText}>{t('common.currency')}</Text>
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          {formData.measurementType === MeasurementType.WEIGHT
                            ? t('products.stock_grams')
                            : t('products.stock')}
                        </Text>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.numericInput}
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

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('products.description')}</Text>
                        <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                          <TextInput
                            style={[styles.numericInput, { fontSize: 16, height: '100%' }]}
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
                        disabled={isCreating || !formData.globalProductId || !formData.vendorCategoryId || !formData.price}
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

const ProductsScreen = ({ navigation }: any) => {
  const {
    t,
    isLoading,
    categories,
    globalProducts,
    isGlobalProductsLoading,
    addProductModalVisible,
    setAddProductModalVisible,
    handleAddProduct,
    isCreatingProduct,
    openAddProductModal,
    setGlobalSearchStr,
  } = useProductsLogic();

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
        data={categories}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryCard}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('VendorCategoryProducts', {
                categoryId: item.id,
                categoryName: item.name,
              })
            }
          >
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: (item as any).color || theme.colors.primary },
              ]}
            />
            <Text style={styles.categoryName}>{item.name}</Text>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={80} color={theme.colors.border} />
            <Text style={styles.emptyText}>{t('products.no_products')}</Text>
          </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: theme.spacing.lg, paddingBottom: 100 },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 10,
    ...theme.shadows.soft,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.secondary,
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

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { width: '100%' },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
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
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    height: 60,
  },
  numericInput: {
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
  globalProductItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerItemText: { fontSize: 16, color: theme.colors.secondary },
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
  emptyPickerContainer: { padding: 24, alignItems: 'center' },
});

export default ProductsScreen;

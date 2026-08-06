import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AppText as Text } from '@city-market/mobile-ui';
import { useTranslation } from 'react-i18next';
import { X, Search, Check, Plus, Trash2, PackagePlus } from 'lucide-react-native';
import { theme } from '../theme';
import { MeasurementType } from '@city-market/shared';
import type { BulkAddVendorProductsFromGlobalItem } from '@city-market/shared';

interface SelectedItem {
  product: any;
  price: string;
  stock: string;
}

interface BulkAddProductsModalProps {
  visible: boolean;
  onClose: () => void;
  globalProducts: any[];
  globalProductsTotal?: number;
  isGlobalProductsLoading?: boolean;
  onSearchChange: (search: string) => void;
  onSubmit: (items: BulkAddVendorProductsFromGlobalItem[]) => Promise<{ added: number; skipped: number } | undefined>;
  isSubmitting?: boolean;
  globalCategories?: any[];
  globalCategoryFilter?: string;
  onCategoryFilterChange: (categoryId: string) => void;
  onImportCategory: (categoryId: string) => Promise<{ added: number; skipped: number } | undefined>;
  isImportingCategory?: boolean;
}

const BulkAddProductsModal: React.FC<BulkAddProductsModalProps> = ({
  visible,
  onClose,
  globalProducts,
  globalProductsTotal = 0,
  isGlobalProductsLoading,
  onSearchChange,
  onSubmit,
  isSubmitting,
  globalCategories = [],
  globalCategoryFilter = '',
  onCategoryFilterChange,
  onImportCategory,
  isImportingCategory,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map());
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setSelected(new Map());
      setResult(null);
    }
  }, [visible]);

  const selectedList = useMemo(() => Array.from(selected.values()), [selected]);

  const toggleProduct = (product: any) => {
    setResult(null);
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, { product, price: '', stock: '' });
      }
      return next;
    });
  };

  const updateSelected = (id: string, patch: Partial<Pick<SelectedItem, 'price' | 'stock'>>) => {
    setResult(null);
    setSelected(prev => {
      const current = prev.get(id);
      if (!current) return prev;
      const next = new Map(prev);
      next.set(id, { ...current, ...patch });
      return next;
    });
  };

  const removeProduct = (id: string) => {
    setResult(null);
    setSelected(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedList.length === 0) return;
    const items: BulkAddVendorProductsFromGlobalItem[] = selectedList.map(({ product, price, stock }) => {
      const isWeight = product.measurementType === MeasurementType.WEIGHT;
      const stockNum = parseInt(stock, 10) || 0;
      return {
        globalProductId: product.id,
        price: parseFloat(price) || 0,
        stockQuantity: isWeight ? undefined : stockNum,
        stockWeightGrams: isWeight ? stockNum : undefined,
      };
    });

    const summary = await onSubmit(items);
    if (summary) {
      setResult(summary);
      setSelected(new Map());
    }
  };

  const handleImportCategory = async () => {
    if (!globalCategoryFilter) return;
    const summary = await onImportCategory(globalCategoryFilter);
    if (summary) {
      setResult(summary);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('products.bulk_add_title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={globalProducts}
            keyExtractor={(p: any) => p.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListHeaderComponent={
              <View>
                {selectedList.length > 0 && (
                  <View style={styles.selectedContainer}>
                    {selectedList.map(({ product, price, stock }) => {
                      const isWeight = product.measurementType === MeasurementType.WEIGHT;
                      return (
                        <View key={product.id} style={styles.selectedRow}>
                          <Text style={styles.selectedName} numberOfLines={1}>
                            {product.name}
                          </Text>
                          <View style={styles.selectedInputs}>
                            <TextInput
                              style={styles.smallInput}
                              placeholder={t('common.currency')}
                              keyboardType="decimal-pad"
                              value={price}
                              onChangeText={val => updateSelected(product.id, { price: val })}
                            />
                            <TextInput
                              style={styles.smallInput}
                              placeholder={isWeight ? t('inventory.units.gram') : t('products.unit')}
                              keyboardType="number-pad"
                              value={stock}
                              onChangeText={val => updateSelected(product.id, { stock: val })}
                            />
                            <TouchableOpacity onPress={() => removeProduct(product.id)} style={styles.removeBtn}>
                              <Trash2 size={16} color={theme.colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.searchContainer}>
                  <Search size={20} color={theme.colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t('products.search_global_placeholder')}
                    value={search}
                    onChangeText={text => {
                      setSearch(text);
                      onSearchChange(text);
                    }}
                  />
                  {isGlobalProductsLoading && (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginStart: 8 }} />
                  )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryChipsRow}>
                  <TouchableOpacity
                    style={[styles.categoryChip, !globalCategoryFilter && styles.categoryChipActive]}
                    onPress={() => onCategoryFilterChange('')}
                  >
                    <Text style={[styles.categoryChipText, !globalCategoryFilter && styles.categoryChipTextActive]}>
                      {t('common.all')}
                    </Text>
                  </TouchableOpacity>
                  {globalCategories.map((cat: any) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, globalCategoryFilter === cat.id && styles.categoryChipActive]}
                      onPress={() => onCategoryFilterChange(cat.id === globalCategoryFilter ? '' : cat.id)}
                    >
                      <Text
                        style={[styles.categoryChipText, globalCategoryFilter === cat.id && styles.categoryChipTextActive]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {!!globalCategoryFilter && (
                  <View style={styles.importCategoryBanner}>
                    <View style={styles.importCategoryRow}>
                      <Text style={styles.importCategoryText}>
                        {t('vendors.category_product_count', { count: globalProductsTotal })}
                      </Text>
                      <TouchableOpacity
                        style={[styles.importCategoryBtn, (isImportingCategory || globalProductsTotal === 0) && { opacity: 0.6 }]}
                        onPress={handleImportCategory}
                        disabled={isImportingCategory || globalProductsTotal === 0}
                      >
                        {isImportingCategory ? (
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                          <>
                            <PackagePlus size={16} color={theme.colors.primary} />
                            <Text style={styles.importCategoryBtnText}>
                              {t('vendors.import_all_from_category')}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.importCategoryHint}>
                      {t('products.import_all_hint')}
                    </Text>
                  </View>
                )}
              </View>
            }
            renderItem={({ item }: any) => {
              const isSelected = selected.has(item.id);
              return (
                <TouchableOpacity
                  style={[styles.globalProductItem, isSelected && styles.globalProductItemSelected]}
                  onPress={() => toggleProduct(item)}
                >
                  <Text style={styles.globalProductName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isSelected && <Check size={18} color={theme.colors.primary} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyPickerContainer}>
                <Text style={styles.emptyText}>{t('common.no_results')}</Text>
              </View>
            }
            ListFooterComponent={
              <View style={styles.footer}>
                {result && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultAdded}>
                      {result.added} {t('products.bulk_added_count')}
                    </Text>
                    <Text style={styles.resultSkipped}>
                      {result.skipped} {t('products.bulk_skipped_count')}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, (isSubmitting || selectedList.length === 0) && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting || selectedList.length === 0}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={theme.colors.white} size="small" />
                  ) : (
                    <>
                      <Plus size={20} color={theme.colors.white} />
                      <Text style={styles.saveBtnText}>
                        {t('products.bulk_add_n', { count: selectedList.length })}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    height: '90%',
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
  selectedContainer: {
    marginBottom: theme.spacing.md,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  selectedName: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginEnd: 8,
  },
  selectedInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
  smallInput: {
    width: 64,
    flexShrink: 0,
    height: 36,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    fontSize: 13,
    color: theme.colors.text,
  },
  removeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 12,
    marginBottom: 12,
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
  categoryChipsRow: {
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginEnd: 8,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textMuted,
  },
  categoryChipTextActive: {
    color: theme.colors.white,
  },
  importCategoryBanner: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  importCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  importCategoryText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  importCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  importCategoryBtnText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  importCategoryHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  globalProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  globalProductItemSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  globalProductName: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginEnd: 8,
  },
  emptyPickerContainer: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 16, color: theme.colors.textMuted },
  footer: {
    marginTop: theme.spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  resultAdded: { color: theme.colors.success, fontWeight: theme.typography.weights.semibold },
  resultSkipped: { color: theme.colors.warning, fontWeight: theme.typography.weights.semibold },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginStart: 10,
  },
});

export default BulkAddProductsModal;

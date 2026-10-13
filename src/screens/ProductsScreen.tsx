import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  AppText as Text,
  Button,
  Chip,
  IconButton,
  StatusBadge,
  EmptyState,
  LoadingState,
  palette,
  radii,
  sizes,
  space,
  elevation,
  formatWeight,
  type Tone,
} from '@city-market/mobile-ui';
import type { TFunction } from 'i18next';
import { Package, X, Plus, Tag, Boxes, CircleAlert, CircleCheck, CircleX, type LucideIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '../components/common/CustomHeader';
import QueryError from '../components/common/QueryError';
import ImageWithPlaceholder from '../components/common/ImageWithPlaceholder';
import { MeasurementType, VendorProduct, WeightUnit } from '@city-market/shared';
import { useProductsLogic } from '../hooks/useProductsLogic';
import { useFormat } from '../hooks/useFormat';
import BulkAddProductsModal from '../components/BulkAddProductsModal';

const LOW_STOCK_THRESHOLD_UNITS = 10;
const LOW_STOCK_THRESHOLD_GRAMS = 1000;

type EditMode = 'price' | 'stock';

const stockState = (p: VendorProduct): { tone: Tone; icon: LucideIcon; key: string } => {
  const isWeight = p.measurementType === MeasurementType.WEIGHT;
  const amount = isWeight ? p.stockWeightGrams ?? 0 : p.stockQuantity;
  if (amount <= 0) return { tone: 'error', icon: CircleX, key: 'inventory.out_of_stock' };
  if (amount <= (isWeight ? LOW_STOCK_THRESHOLD_GRAMS : LOW_STOCK_THRESHOLD_UNITS)) {
    return { tone: 'warning', icon: CircleAlert, key: 'inventory.low_stock' };
  }
  return { tone: 'success', icon: CircleCheck, key: 'inventory.in_stock' };
};

const stockText = (p: VendorProduct, t: TFunction) =>
  p.measurementType === MeasurementType.WEIGHT
    ? formatWeight(p.stockWeightGrams ?? 0, t('inventory.units.kg'))
    : `${p.stockQuantity} ${t('inventory.unit')}`;

/* ------------------------------------------------------------------ */

interface EditSheetProps {
  mode: EditMode | null;
  product: VendorProduct | null;
  onClose: () => void;
  onSavePrice: (id: string, price: number) => void;
  onSaveStock: (id: string, quantity?: number, weightGrams?: number) => void;
  isUpdating: boolean;
  t: TFunction;
  money: (n: number | null | undefined) => string;
}

/** Single bottom sheet for editing price or stock, with validation. */
const EditSheet = ({ mode, product, onClose, onSavePrice, onSaveStock, isUpdating, t, money }: EditSheetProps) => {
  const isWeight = product?.measurementType === MeasurementType.WEIGHT;
  const inKg = product?.weightUnit === WeightUnit.KG;

  const initial = (() => {
    if (!product || !mode) return '';
    if (mode === 'price') return product.price ? String(product.price) : '';
    if (!isWeight) return String(product.stockQuantity ?? 0);
    const grams = product.stockWeightGrams ?? 0;
    return inKg ? String(grams / 1000) : String(grams);
  })();

  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setValue(initial);
    setError(null);
  }, [initial, mode]);

  if (!product || !mode) return null;

  const unitLabel =
    mode === 'price' ? t('common.currency')
    : isWeight ? (inKg ? t('inventory.units.kg') : t('inventory.units.gram'))
    : t('inventory.unit');

  const save = () => {
    const n = Number(value.replace(',', '.').trim());
    if (mode === 'price') {
      // The API rejects a missing/zero price.
      if (!value.trim() || !Number.isFinite(n) || n <= 0) return setError(t('inventory.invalid_price'));
      return onSavePrice(product.id, n);
    }
    if (!value.trim() || !Number.isFinite(n) || n < 0) return setError(t('inventory.invalid_stock'));
    if (isWeight) return onSaveStock(product.id, undefined, Math.round(inKg ? n * 1000 : n));
    return onSaveStock(product.id, Math.round(n), undefined);
  };

  const current =
    mode === 'price'
      ? product.price ? money(product.price) : t('inventory.no_price')
      : stockText(product, t);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.flex}>
              <Text variant="heading" color={palette.text}>
                {mode === 'price' ? t('inventory.update_price') : t('inventory.update_stock')}
              </Text>
              <Text variant="body" color={palette.textSecondary} numberOfLines={2}>{product.name}</Text>
            </View>
            <IconButton icon={X} onPress={onClose} accessibilityLabel={t('common.cancel')} variant="soft" size={40} />
          </View>

          <View style={styles.currentRow}>
            <Text variant="caption" color={palette.textMuted}>
              {mode === 'price' ? t('inventory.current_price') : t('inventory.current_stock')}
            </Text>
            <Text variant="bodyStrong" color={palette.text} style={styles.tabular}>{current}</Text>
          </View>

          <Text variant="label" color={palette.text} style={styles.inputLabel}>
            {mode === 'price' ? t('inventory.new_price') : t('inventory.new_stock')}
            {mode === 'price' ? ` (${isWeight ? t('inventory.per_kg') : t('inventory.per_unit')})` : ''}
          </Text>
          <View style={[styles.inputBox, error && styles.inputBoxError]}>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={v => {
                setValue(v);
                if (error) setError(null);
              }}
              keyboardType={mode === 'stock' && !isWeight ? 'number-pad' : 'decimal-pad'}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={save}
              accessibilityLabel={mode === 'price' ? t('inventory.new_price') : t('inventory.new_stock')}
            />
            <Text variant="bodyStrong" color={palette.textMuted}>{unitLabel}</Text>
          </View>
          {error ? (
            <Text variant="caption" color={palette.error} style={styles.errorText} accessibilityRole="alert">{error}</Text>
          ) : null}

          <Button label={t('common.save')} onPress={save} loading={isUpdating} size="lg" fullWidth style={styles.saveBtn} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */

interface RowProps {
  item: VendorProduct;
  onEdit: (p: VendorProduct, mode: EditMode) => void;
  t: TFunction;
  money: (n: number | null | undefined) => string;
}

const ProductRow = React.memo(({ item, onEdit, t, money }: RowProps) => {
  const isWeight = item.measurementType === MeasurementType.WEIGHT;
  const stock = stockState(item);
  const hasPrice = item.price > 0;
  return (
    <View style={styles.row}>
      <ImageWithPlaceholder uri={item.imageUrl || null} style={styles.thumb} />
      <View style={styles.rowBody}>
        <Text variant="bodyStrong" color={palette.text} numberOfLines={2}>{item.name}</Text>
        {item.vendorCategoryName ? (
          <Text variant="caption" color={palette.textMuted} numberOfLines={1}>{item.vendorCategoryName}</Text>
        ) : null}
        <View style={styles.metaRow}>
          {hasPrice ? (
            <Text variant="bodyStrong" color={palette.primary} style={styles.tabular}>
              {money(item.price)}
              <Text variant="caption" color={palette.textMuted}> {isWeight ? t('inventory.per_kg') : t('inventory.per_unit')}</Text>
            </Text>
          ) : (
            <StatusBadge size="sm" tone="warning" icon={Tag} label={t('inventory.no_price')} />
          )}
          <StatusBadge size="sm" tone={stock.tone} icon={stock.icon} label={`${t(stock.key)} · ${stockText(item, t)}`} />
        </View>
        <View style={styles.actions}>
          <Button
            label={t('inventory.edit_price')}
            icon={Tag}
            size="sm"
            variant={hasPrice ? 'secondary' : 'primary'}
            onPress={() => onEdit(item, 'price')}
            accessibilityLabel={`${t('inventory.update_price')}: ${item.name}`}
            style={styles.flex}
          />
          <Button
            label={t('inventory.edit_stock')}
            icon={Boxes}
            size="sm"
            variant="secondary"
            onPress={() => onEdit(item, 'stock')}
            accessibilityLabel={`${t('inventory.update_stock')}: ${item.name}`}
            style={styles.flex}
          />
        </View>
      </View>
    </View>
  );
});

/* ------------------------------------------------------------------ */

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
    error,
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
  const { money } = useFormat();

  const [editing, setEditing] = useState<{ product: VendorProduct; mode: EditMode } | null>(null);
  const openEdit = useCallback((product: VendorProduct, mode: EditMode) => setEditing({ product, mode }), []);
  const closeEdit = useCallback(() => setEditing(null), []);

  const handleUpdateStock = useCallback(
    (id: string, quantity?: number, weightGrams?: number) =>
      updateStock({ id, stock: quantity, weight: weightGrams }, { onSuccess: closeEdit }),
    [updateStock, closeEdit],
  );
  const handleUpdatePrice = useCallback(
    (id: string, price: number) => updatePrice({ id, price }, { onSuccess: closeEdit }),
    [updatePrice, closeEdit],
  );

  const addButton = (
    <IconButton icon={Plus} variant="primary" onPress={openBulkAddModal} accessibilityLabel={t('products.bulk_add_title')} size={40} />
  );

  let body: React.ReactNode;
  if (isLoading) {
    body = <LoadingState />;
  } else if (error && products.length === 0) {
    body = <QueryError error={error} onRetry={refetch} retrying={isRefetching} />;
  } else {
    body = (
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.primary} colors={[palette.primary]} />
        }
        renderItem={({ item }) => <ProductRow item={item} onEdit={openEdit} t={t} money={money} />}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={palette.primary} /> : null}
        ListEmptyComponent={
          <EmptyState
            icon={Package}
            title={t('products.no_products')}
            actionLabel={t('products.bulk_add_title')}
            onAction={openBulkAddModal}
          />
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader title={t('products.title')} rightComponent={addButton} />
      {categories.length > 0 ? (
        <View style={styles.filtersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <Chip label={t('common.all')} selected={!selectedCategoryId} onPress={() => setSelectedCategoryId(undefined)} />
            {categories.map((c: any) => (
              <Chip key={c.id} label={c.name} selected={selectedCategoryId === c.id} onPress={() => setSelectedCategoryId(c.id)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {body}

      <EditSheet
        mode={editing?.mode ?? null}
        product={editing?.product ?? null}
        onClose={closeEdit}
        onSavePrice={handleUpdatePrice}
        onSaveStock={handleUpdateStock}
        isUpdating={isUpdatingPrice || isUpdatingStock}
        t={t}
        money={money}
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
  container: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  filtersBar: {
    backgroundColor: palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  filters: { paddingHorizontal: space.lg, paddingVertical: space.sm, gap: space.sm },
  listContent: { padding: space.lg, gap: space.md, flexGrow: 1 },
  footerLoader: { paddingVertical: space.lg },
  row: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
    ...elevation.card,
  },
  thumb: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  rowBody: { flex: 1, gap: space.xs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: palette.overlay },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.lg },
  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceMuted,
    marginBottom: space.lg,
  },
  inputLabel: { marginBottom: space.sm },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: sizes.input + 4,
    paddingHorizontal: space.lg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.primary,
    backgroundColor: palette.surface,
  },
  inputBoxError: { borderColor: palette.error },
  input: { flex: 1, fontSize: 22, fontWeight: '700', color: palette.text, paddingVertical: 0 },
  errorText: { marginTop: space.xs },
  saveBtn: { marginTop: space.lg },
});

export default ProductsScreen;

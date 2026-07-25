import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Package, Plus, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import CustomHeader from '../components/common/CustomHeader';
import { useProductsLogic } from '../hooks/useProductsLogic';
import BulkAddProductsModal from '../components/BulkAddProductsModal';

const ProductsScreen = ({ navigation }: any) => {
  const {
    t,
    isLoading,
    categories,
    globalCategories,
    globalProducts,
    globalProductsTotal,
    isGlobalProductsLoading,
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

      <TouchableOpacity style={styles.fab} onPress={openBulkAddModal}>
        <Plus size={30} color={theme.colors.white} />
      </TouchableOpacity>

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
});

export default ProductsScreen;

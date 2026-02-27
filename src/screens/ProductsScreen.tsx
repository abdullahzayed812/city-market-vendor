import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, Package, MoreVertical, Layers } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '../hooks/useProducts';
import { theme } from '../theme';
import CustomHeader from '../components/common/CustomHeader';

const ProductsScreen = () => {
  const { t } = useTranslation();
  const { products, isLoading } = useProducts();

  const renderProductItem = ({ item }: any) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <Package size={28} color={theme.colors.textLight} />
        )}
      </View>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity style={styles.moreBtn}>
            <MoreVertical size={18} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <View style={styles.productFooter}>
          <View style={styles.stockBadge}>
            <Layers size={12} color={theme.colors.primary} />
            <Text style={styles.stockText}>{t('products.stock')}: {item.stockQuantity}</Text>
          </View>
        </View>
      </View>
    </View>
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
      <CustomHeader title={t('products.title')} />
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={80} color={theme.colors.border} />
            <Text style={styles.emptyText}>{t('products.no_products')}</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
        <Plus color={theme.colors.white} size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: theme.spacing.lg },
  productCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  productImageContainer: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 16,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  productInfo: { flex: 1 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontSize: 17, fontWeight: theme.typography.weights.bold, color: theme.colors.secondary, flex: 1 },
  moreBtn: { padding: 4 },
  productPrice: { fontSize: 15, color: theme.colors.success, fontWeight: theme.typography.weights.bold, marginTop: 4 },
  productFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stockText: { fontSize: 12, color: theme.colors.primary, fontWeight: theme.typography.weights.semibold, marginStart: 6 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: theme.colors.textMuted },
});

export default ProductsScreen;

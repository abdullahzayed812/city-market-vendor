import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package, MoreVertical, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '../hooks/useProducts';
import { theme } from '../theme';
import CustomHeader from '../components/common/CustomHeader';
import { getBaseURL } from '../services/api/config';
import ImageWithPlaceholder from '../components/common/ImageWithPlaceholder';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

// Separate Product Card Component for better performance
const ProductCard = React.memo(({ item, onEdit }: any) => (
  <View style={styles.productCardWrapper}>
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onEdit(item)}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        <ImageWithPlaceholder
          uri={item.imageUrl ? `${getBaseURL()}${item.imageUrl}` : null}
          style={styles.productImage}
        />
        <TouchableOpacity style={styles.moreBtn}>
          <MoreVertical size={16} color={theme.colors.white} />
        </TouchableOpacity>
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
                backgroundColor:
                  item.stockQuantity < 10
                    ? 'rgba(255, 59, 48, 0.1)'
                    : 'rgba(79, 82, 64, 0.05)',
              },
            ]}
          >
            <Text
              style={[
                styles.stockText,
                {
                  color:
                    item.stockQuantity < 10
                      ? theme.colors.error
                      : theme.colors.primary,
                },
              ]}
            >
              {item.stockQuantity}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  </View>
));

const ProductsScreen = () => {
  const { t } = useTranslation();
  const { products, categories, isLoading } = useProducts();

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

  const handleEditProduct = useCallback((product: any) => {
    // Navigate to edit product or open actions menu
    console.log('Edit product:', product.name);
  }, []);

  const renderRow = useCallback(
    ({ item }: { item: any[] }) => (
      <View style={styles.row}>
        {item.map(product => (
          <ProductCard
            key={product.id}
            item={product}
            onEdit={handleEditProduct}
          />
        ))}
        {item.length === 1 && <View style={styles.productCardWrapper} />}
      </View>
    ),
    [handleEditProduct],
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
});

export default ProductsScreen;

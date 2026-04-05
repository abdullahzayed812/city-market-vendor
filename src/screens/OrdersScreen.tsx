import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ChevronRight, Package, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import CustomHeader from '../components/common/CustomHeader';
import { useOrders } from '../hooks/useOrders';

const OrdersScreen = ({ navigation }: any) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { orders, isLoading } = useOrders();

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return { color: theme.colors.warning, label: t('orders.status_pending') };
      case 'CONFIRMED': return { color: theme.colors.info, label: t('orders.status_confirmed') };
      case 'PROPOSAL_SENT': return { color: theme.colors.info, label: t('orders.status_proposal_sent') };
      case 'PREPARING': return { color: theme.colors.primary, label: t('orders.status_preparing') };
      case 'READY': return { color: theme.colors.primary, label: t('orders.status_ready') };
      case 'PICKED_UP': return { color: theme.colors.secondary, label: t('orders.status_picked_up') };
      case 'ON_THE_WAY': return { color: theme.colors.secondary, label: t('orders.status_on_the_way') };
      case 'DELIVERED': return { color: theme.colors.success, label: t('orders.status_delivered') };
      case 'CANCELLED': return { color: theme.colors.error, label: t('orders.status_cancelled') };
      default: return { color: theme.colors.textMuted, label: status };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderOrderItem = ({ item }: any) => {
    const status = getStatusConfig(item.status);
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.idGroup}>
            <View style={styles.iconCircle}>
              <ShoppingBag size={18} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.orderId}>{t('orders.order_id')} #{item.id.slice(-6).toUpperCase()}</Text>
              <View style={styles.timeRow}>
                <Clock size={12} color={theme.colors.textLight} />
                <Text style={styles.dateText}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <Package size={16} color={theme.colors.textMuted} />
            <Text style={styles.detailText}>
              {item.items?.length || 0} {t('products.title')}
            </Text>
          </View>
          <Text style={styles.totalAmount}>${item.totalAmount?.toFixed(2)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>{t('common.view_details')}</Text>
          <ChevronRight
            size={16}
            color={theme.colors.primary}
            style={isRTL && { transform: [{ rotate: '180deg' }] }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title={t('orders.title')} />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShoppingBag size={80} color={theme.colors.border} />
            <Text style={styles.emptyText}>{t('orders.no_orders')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: theme.spacing.lg },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  idGroup: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dateText: { fontSize: 12, color: theme.colors.textLight, marginStart: 4 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  statusText: { fontSize: 12, fontWeight: theme.typography.weights.bold, textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 16, opacity: 0.5 },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: theme.colors.textMuted, marginStart: 8 },
  totalAmount: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    padding: 12,
    borderRadius: theme.radius.md,
  },
  viewDetailsText: { fontSize: 13, fontWeight: theme.typography.weights.bold, color: theme.colors.primary },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: theme.colors.textMuted },
});

export default OrdersScreen;

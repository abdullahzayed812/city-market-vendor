import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import {
  AppText as Text,
  Card,
  Chip,
  StatusBadge,
  EmptyState,
  LoadingState,
  ForwardIcon,
  palette,
  radii,
  space,
  shortId,
} from '@city-market/mobile-ui';
import { ShoppingBag, Package, Timer } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TFunction } from 'i18next';
import CustomHeader from '../components/common/CustomHeader';
import QueryError from '../components/common/QueryError';
import { useOrdersLogic } from '../hooks/useOrdersLogic';
import { useSlaCountdown } from '../hooks/useSlaCountdown';
import { useFormat } from '../hooks/useFormat';
import { VendorOrderStatus } from '@city-market/shared';
import { vendorOrderStatusMeta, vendorOrderStatusKey, type OrderFilter } from '../features/orderStatus';

const FILTERS: OrderFilter[] = ['action', 'active', 'done', 'all'];

const Countdown = ({ deadline, label }: { deadline?: Date | string | null; label: string }) => {
  const { remainingSeconds, isExpired, isWarning, formattedTime } = useSlaCountdown(deadline);
  if (!deadline || isExpired || remainingSeconds === 0) return null;
  const fg = isWarning ? palette.error : palette.warning;
  return (
    <View style={[styles.countdown, { backgroundColor: isWarning ? palette.errorSoft : palette.warningSoft }]}>
      <Timer size={14} color={fg} />
      <Text variant="caption" color={fg} style={styles.flexShrink}>{label}</Text>
      <Text variant="label" color={fg} style={styles.tabular}>{formattedTime}</Text>
    </View>
  );
};

interface OrderItemProps {
  item: any;
  t: TFunction;
  money: (n: number | null | undefined) => string;
  onOpen: (id: string) => void;
}

const OrderItem = React.memo(({ item, t, money, onOpen }: OrderItemProps) => {
  const meta = vendorOrderStatusMeta(item.status);
  const itemsCount = item.items?.length ?? 0;
  const created = new Date(item.createdAt);
  return (
    <Card
      appearance="raised"
      onPress={() => onOpen(item.id)}
      accessibilityLabel={`${t('orders.order_id')} ${shortId(item.id)}`}
      style={[styles.card, item.status === VendorOrderStatus.PENDING && styles.cardUrgent]}
    >
      <View style={styles.row}>
        <View style={styles.flexShrink}>
          <Text variant="subheading" color={palette.text}>
            {t('orders.order_id')} {shortId(item.id)}
          </Text>
          <Text variant="caption" color={palette.textMuted}>
            {created.toLocaleDateString()} · {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <StatusBadge label={t(vendorOrderStatusKey(item.status))} tone={meta.tone} icon={meta.icon} />
      </View>

      {item.status === VendorOrderStatus.PENDING && (
        <Countdown deadline={item.vendorConfirmationDeadline} label={t('orders.confirm_before')} />
      )}
      {item.status === VendorOrderStatus.PROPOSAL_SENT && (
        <Countdown deadline={item.customerDecisionDeadline} label={t('orders.customer_deciding')} />
      )}

      <View style={[styles.row, styles.footer]}>
        <View style={styles.itemsRow}>
          <Package size={16} color={palette.textMuted} />
          <Text variant="caption" color={palette.textSecondary}>{t('orders.items_count', { count: itemsCount })}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text variant="heading" color={palette.text} style={styles.tabular}>{money(item.totalAmount)}</Text>
          <ForwardIcon size={18} color={palette.textMuted} />
        </View>
      </View>
    </Card>
  );
});

const OrdersScreen = ({ navigation, route }: any) => {
  const requested: OrderFilter | undefined = route?.params?.filter;
  const [filter, setFilter] = useState<OrderFilter>(requested ?? 'all');
  // The dashboard deep-links into a specific filter.
  useEffect(() => {
    if (requested) setFilter(requested);
  }, [requested]);

  const {
    t,
    orders,
    counts,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrdersLogic(filter);
  const { money } = useFormat();

  const openOrder = useCallback((id: string) => navigation.navigate('OrderDetails', { orderId: id }), [navigation]);
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  let body: React.ReactNode;
  if (isLoading) {
    body = <LoadingState />;
  } else if (error && counts.all === 0) {
    body = <QueryError error={error} onRetry={refetch} retrying={isRefetching} />;
  } else {
    body = (
      <FlatList
        data={orders}
        renderItem={({ item }) => <OrderItem item={item} t={t} money={money} onOpen={openOrder} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.primary} colors={[palette.primary]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator style={styles.footerSpinner} color={palette.primary} /> : null
        }
        ListEmptyComponent={
          // Filters apply to loaded pages only; offer to load more instead of claiming there are none.
          <EmptyState
            icon={ShoppingBag}
            title={filter === 'all' ? t('orders.no_orders') : t('orders.no_orders_filter')}
            actionLabel={hasNextPage ? t('common.load_more') : undefined}
            onAction={hasNextPage ? loadMore : undefined}
          />
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader title={t('orders.title')} />
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map(f => (
            <Chip
              key={f}
              label={t(`orders.filter_${f}`)}
              count={counts[f]}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      </View>
      {body}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  filtersBar: {
    backgroundColor: palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  filters: { paddingHorizontal: space.lg, paddingVertical: space.sm, gap: space.sm },
  listContent: { padding: space.lg, gap: space.md, flexGrow: 1 },
  card: { gap: space.md },
  cardUrgent: { borderWidth: 1.5, borderColor: palette.warning },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.sm },
  footer: {
    alignItems: 'center',
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.sm,
  },
  flexShrink: { flexShrink: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  footerSpinner: { paddingVertical: space.lg },
});

export default OrdersScreen;

import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
  AppText as Text,
  Card,
  SectionHeader,
  StatusBadge,
  SummaryRow,
  Divider,
  EmptyState,
  LoadingState,
  palette,
  space,
} from '@city-market/mobile-ui';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, CircleCheck, Hourglass, ReceiptText, CalendarRange } from 'lucide-react-native';
import CustomHeader from '../components/common/CustomHeader';
import QueryError from '../components/common/QueryError';
import { useEarnings } from '../hooks/useEarnings';
import { useFormat } from '../hooks/useFormat';

const formatDate = (d: string | Date | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');
/** Commission is a deduction; show it with a minus sign so it can't be read as income. */
const deduction = (money: (n: number) => string, n: number | null | undefined) =>
  n && n > 0 ? `− ${money(n)}` : money(n ?? 0);

const EarningsScreen = () => {
  const { t } = useTranslation();
  const { money } = useFormat();
  const { pendingData, settlements, isLoading, isRefetching, refetch, error } = useEarnings();

  const header = <CustomHeader title={t('financial.earnings_and_settlements')} subtitle={t('financial.track_payouts_subtitle')} />;

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error && !pendingData && settlements.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        <QueryError error={error} onRetry={refetch} retrying={isRefetching} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.primary} colors={[palette.primary]} />
        }
      >
        {/* Pending (not yet settled) — what the platform owes the vendor right now */}
        <Card style={styles.pendingCard}>
          <View style={styles.pendingHead}>
            <View style={styles.pendingIcon}>
              <Wallet size={22} color={palette.primary} />
            </View>
            <View style={styles.flex}>
              <Text variant="subheading" color={palette.text}>{t('financial.awaiting_title')}</Text>
              <Text variant="caption" color={palette.textMuted}>{t('financial.awaiting_hint')}</Text>
            </View>
          </View>
          <SummaryRow label={t('financial.unsettled_orders')} value={String(pendingData?.unsettledOrders ?? 0)} />
          <SummaryRow label={t('financial.sales')} value={money(pendingData?.totalRevenue ?? 0)} />
          <SummaryRow label={t('financial.commission')} value={deduction(money, pendingData?.totalCommission)} emphasis="negative" />
          <Divider />
          <SummaryRow label={t('financial.net')} value={money(pendingData?.netPayout ?? 0)} emphasis="total" />
          {pendingData?.oldestUnsettledOrderDate ? (
            <Text variant="caption" color={palette.textMuted} style={styles.note}>
              {t('financial.oldest_unsettled', { date: formatDate(pendingData.oldestUnsettledOrderDate) })}
            </Text>
          ) : null}
        </Card>

        <SectionHeader title={t('financial.settlement_history')} icon={ReceiptText} style={styles.sectionGap} />
        {settlements.length === 0 ? (
          <Card>
            <EmptyState icon={ReceiptText} title={t('financial.no_settlement_history')} compact />
          </Card>
        ) : (
          settlements.map((item: any) => {
            const paid = item.status === 'PAID';
            return (
              <Card key={item.id} style={styles.settlement}>
                <View style={styles.settlementHead}>
                  <View style={styles.periodRow}>
                    <CalendarRange size={16} color={palette.textMuted} />
                    <Text variant="label" color={palette.text} style={styles.flexShrink}>
                      {formatDate(item.periodStart)} – {formatDate(item.periodEnd)}
                    </Text>
                  </View>
                  <StatusBadge
                    size="sm"
                    tone={paid ? 'success' : 'warning'}
                    icon={paid ? CircleCheck : Hourglass}
                    label={paid ? t('financial.status_paid') : t('financial.status_pending')}
                  />
                </View>
                <Text variant="caption" color={palette.textMuted}>
                  {t('financial.orders_count', { count: item.orderCount })}
                  {paid && item.settledAt ? ` · ${t('financial.paid_on', { date: formatDate(item.settledAt) })}` : ''}
                </Text>
                <Divider spacing={space.sm} />
                <SummaryRow label={t('financial.sales')} value={money(item.totalVendorRevenue)} />
                <SummaryRow label={t('financial.commission')} value={deduction(money, item.totalCommission)} emphasis="negative" />
                <SummaryRow label={t('financial.net')} value={money(item.netPayout)} emphasis={paid ? 'positive' : 'normal'} />
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.huge },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  sectionGap: { marginTop: space.md, marginBottom: 0 },
  pendingCard: { borderColor: palette.primaryMuted, borderWidth: 1 },
  pendingHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  pendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primarySoft,
  },
  note: { marginTop: space.sm },
  settlement: { gap: space.xs },
  settlementHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexShrink: 1 },
});

export default EarningsScreen;

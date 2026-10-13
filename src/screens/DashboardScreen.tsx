import React from 'react';
import { View, StyleSheet, ScrollView, Switch, StatusBar, Pressable, RefreshControl } from 'react-native';
import {
  AppText as Text,
  Card,
  SectionHeader,
  StatusBadge,
  SummaryRow,
  Divider,
  LoadingState,
  ForwardIcon,
  palette,
  radii,
  space,
} from '@city-market/mobile-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Package, Banknote, Hourglass, Store, CircleCheck, Ban, Wallet, CalendarDays, type LucideIcon } from 'lucide-react-native';
import CustomHeader from '../components/common/CustomHeader';
import QueryError from '../components/common/QueryError';
import { useDashboard } from '../hooks/useDashboard';
import { useFormat } from '../hooks/useFormat';

const StatTile = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <View style={styles.tile}>
    <View style={styles.tileIcon}>
      <Icon size={18} color={palette.primary} />
    </View>
    <Text variant="heading" color={palette.text} numberOfLines={1} adjustsFontSizeToFit style={styles.tabular}>
      {value}
    </Text>
    <Text variant="caption" color={palette.textMuted} numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const DashboardScreen = ({ navigation }: any) => {
  const {
    t,
    profile,
    profileLoading,
    toggleStatus,
    isUpdatingStatus,
    activeOrdersCount,
    todaySales,
    totalRevenue,
    platformCommission,
    netEarnings,
    productsCount,
    isOpen,
    isSuspended,
    statusLabel,
    pendingOrdersCount,
    profileError,
    refresh,
    isRefreshing,
  } = useDashboard();
  const { money } = useFormat();

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <CustomHeader title={t('dashboard.title')} />
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <CustomHeader title={t('dashboard.title')} />
        <QueryError error={profileError} onRetry={refresh} retrying={isRefreshing} />
      </SafeAreaView>
    );
  }

  const openOrders = () => navigation.navigate('OrdersTab', { screen: 'OrdersList', params: { filter: 'action' } });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <CustomHeader title={profile.shopName || t('common.vendor')} subtitle={t('dashboard.title')} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={palette.primary} colors={[palette.primary]} />
        }
      >
        {/* Shop open/closed: the control that most affects incoming orders */}
        <Card style={[styles.statusCard, isOpen ? styles.statusOpen : styles.statusClosed]}>
          <View style={[styles.statusIcon, { backgroundColor: isOpen ? palette.success : palette.neutral }]}>
            {isSuspended ? <Ban size={22} color={palette.white} /> : <Store size={22} color={palette.white} />}
          </View>
          <View style={styles.flex}>
            <View style={styles.statusTitleRow}>
              <Text variant="subheading" color={palette.text}>{t('dashboard.shop_status')}</Text>
              <StatusBadge
                label={statusLabel}
                tone={isOpen ? 'success' : isSuspended ? 'warning' : 'neutral'}
                icon={isOpen ? CircleCheck : isSuspended ? Ban : undefined}
                size="sm"
              />
            </View>
            <Text variant="caption" color={palette.textSecondary}>
              {isSuspended ? t('dashboard.suspended_hint') : isOpen ? t('dashboard.shop_open_hint') : t('dashboard.shop_closed_hint')}
            </Text>
          </View>
          <Switch
            value={isOpen}
            onValueChange={toggleStatus}
            disabled={isUpdatingStatus || isSuspended}
            trackColor={{ true: palette.primaryMuted, false: palette.borderStrong }}
            thumbColor={isOpen ? palette.primary : palette.white}
            accessibilityLabel={t('dashboard.shop_status')}
          />
        </Card>

        {/* Urgent work first */}
        <Pressable
          onPress={openOrders}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionCard, pendingOrdersCount > 0 && styles.actionCardUrgent, pressed && styles.pressed]}
        >
          <View style={[styles.actionCount, pendingOrdersCount > 0 && styles.actionCountUrgent]}>
            {pendingOrdersCount > 0 ? (
              <Text variant="title" color={palette.white} style={styles.tabular}>{pendingOrdersCount}</Text>
            ) : (
              <Hourglass size={22} color={palette.textMuted} />
            )}
          </View>
          <View style={styles.flex}>
            <Text variant="subheading" color={palette.text}>
              {pendingOrdersCount > 0 ? t('dashboard.needs_action') : t('dashboard.no_action_needed')}
            </Text>
            {pendingOrdersCount > 0 ? (
              <Text variant="caption" color={palette.warning}>{t('dashboard.needs_action_hint')}</Text>
            ) : null}
          </View>
          <ForwardIcon size={20} color={palette.textMuted} />
        </Pressable>

        <SectionHeader title={t('dashboard.operations')} style={styles.sectionGap} />
        <View style={styles.tiles}>
          <StatTile icon={ShoppingCart} label={t('dashboard.active_orders')} value={String(activeOrdersCount)} />
          <StatTile icon={CalendarDays} label={t('dashboard.today_sales')} value={money(todaySales)} />
          <StatTile icon={Package} label={t('dashboard.total_products')} value={String(productsCount)} />
        </View>

        <SectionHeader
          title={t('dashboard.awaiting_settlement')}
          icon={Wallet}
          actionLabel={t('common.view_details')}
          onAction={() => navigation.navigate('EarningsTab')}
          style={styles.sectionGap}
        />
        <Card>
          <Text variant="caption" color={palette.textMuted} style={styles.hint}>
            {t('dashboard.awaiting_settlement_hint')}
          </Text>
          <SummaryRow label={t('dashboard.unsettled_sales')} value={money(totalRevenue)} />
          <SummaryRow
            label={t('dashboard.platform_commission')}
            value={platformCommission > 0 ? `− ${money(platformCommission)}` : money(platformCommission)}
            emphasis="negative"
          />
          <Divider />
          <SummaryRow
            label={t('dashboard.net_due')}
            value={money(netEarnings)}
            emphasis="total"
            trailing={<Banknote size={20} color={palette.primary} />}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.huge,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  sectionGap: {
    marginTop: space.md,
    marginBottom: 0,
  },
  hint: {
    marginBottom: space.sm,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  statusOpen: {
    borderColor: palette.success,
    backgroundColor: palette.successSoft,
  },
  statusClosed: {
    backgroundColor: palette.surface,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.borderStrong,
  },
  actionCardUrgent: {
    borderWidth: 1.5,
    borderColor: palette.warning,
    backgroundColor: palette.warningSoft,
  },
  actionCount: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceMuted,
  },
  actionCountUrgent: {
    backgroundColor: palette.warning,
  },
  tiles: {
    flexDirection: 'row',
    gap: space.sm,
  },
  tile: {
    flex: 1,
    padding: space.md,
    gap: 2,
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.borderStrong,
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primarySoft,
    marginBottom: space.xs,
  },
});

export default DashboardScreen;

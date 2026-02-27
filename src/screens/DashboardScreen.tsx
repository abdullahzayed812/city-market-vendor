import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Activity,
  TrendingUp,
} from 'lucide-react-native';
import { ShopStatus } from '@city-market/shared';
import { useOrders } from '../hooks/useOrders';
import { useVendorProfile } from '../hooks/useVendorProfile';
import CustomHeader from '../components/common/CustomHeader';
import { useProducts } from '../hooks/useProducts';

const DashboardScreen = () => {
  const { t } = useTranslation();

  const {
    profile,
    isLoading: profileLoading,
    toggleStatus,
    isUpdatingStatus,
  } = useVendorProfile();

  const { orders } = useOrders();
  const { products } = useProducts();

  const StatCard = ({ icon: Icon, label, value, color, trend }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
        <Icon size={22} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {trend && (
          <View style={styles.trendContainer}>
            <TrendingUp size={12} color={theme.colors.success} />
            <Text style={styles.trendText}>{trend}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isOpen = profile?.status === ShopStatus.OPEN;
  const activeOrdersCount =
    orders?.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
      .length || 0;
  const todaySales =
    orders
      ?.filter(o => {
        const today = new Date().toDateString();
        return (
          new Date(o.createdAt).toDateString() === today &&
          o.status !== 'CANCELLED'
        );
      })
      .reduce((acc, o) => acc + o.totalAmount, 0) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CustomHeader title={t('dashboard.title')} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>{t('common.welcome_back')}</Text>
            <Text style={styles.vendorName}>
              {profile?.shopName || t('common.vendor')}
            </Text>
          </View>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isOpen
                  ? theme.colors.success + '15'
                  : theme.colors.error + '15',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOpen
                    ? theme.colors.success
                    : theme.colors.error,
                },
              ]}
            />
            <Text
              style={[
                styles.statusIndicatorText,
                { color: isOpen ? theme.colors.success : theme.colors.error },
              ]}
            >
              {isOpen ? t('dashboard.open') : t('dashboard.closed')}
            </Text>
          </View>
        </View>

        <View style={styles.statusSection}>
          <View style={styles.statusInfo}>
            <Activity size={20} color={theme.colors.primary} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusText}>
                {t('dashboard.shop_status')}
              </Text>
              <Text style={styles.statusSubtext}>
                {t('dashboard.control_visibility')}
              </Text>
            </View>
          </View>
          <Switch
            value={isOpen}
            onValueChange={toggleStatus}
            trackColor={{
              true: theme.colors.primary + '30',
              false: theme.colors.border,
            }}
            thumbColor={isOpen ? theme.colors.primary : theme.colors.white}
            disabled={isUpdatingStatus}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon={ShoppingCart}
            label={t('dashboard.active_orders')}
            value={activeOrdersCount.toString()}
            color={theme.colors.primary}
            trend={`+2 ${t('common.today')}`}
          />
          <StatCard
            icon={DollarSign}
            label={t('dashboard.today_sales')}
            value={`$${todaySales.toFixed(2)}`}
            color={theme.colors.success}
            trend={`+8% ${t('common.vs_avg')}`}
          />
          <StatCard
            icon={Package}
            label={t('dashboard.total_products')}
            value={products?.length || '0'}
            color={theme.colors.info}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: theme.spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  welcomeText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.medium,
  },
  vendorName: {
    fontSize: 26,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
    marginTop: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginEnd: 6 },
  statusIndicatorText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
  },
  statusSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.card,
  },
  statusInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusTextContainer: { marginStart: 12 },
  statusText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  statusSubtext: { fontSize: 12, color: theme.colors.textLight, marginTop: 2 },
  statsGrid: { gap: theme.spacing.md },
  statCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 16,
  },
  statInfo: { flex: 1 },
  statValue: {
    fontSize: 22,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  statLabel: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
  trendContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  trendText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.semibold,
    marginStart: 4,
  },
});

export default DashboardScreen;

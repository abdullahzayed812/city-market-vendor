import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShopStatus } from '@city-market/shared';
import { useOrders } from './useOrders';
import { useVendorProfile } from './useVendorProfile';
import { useProducts } from './useProducts';
import { useEarnings } from './useEarnings';
import { theme } from '../theme';

export const useDashboard = () => {
  const { t } = useTranslation();

  const {
    profile,
    isLoading: profileLoading,
    toggleStatus,
    isUpdatingStatus,
  } = useVendorProfile();

  const { orders } = useOrders();
  const { products } = useProducts();
  const { pendingData, isLoading: earningsLoading } = useEarnings();

  const activeOrdersCount = useMemo(() =>
    orders?.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length || 0
    , [orders]);

  const todaySales = useMemo(() =>
    orders
      ?.filter(o => {
        const today = new Date().toDateString();
        return (
          new Date(o.createdAt).toDateString() === today &&
          o.status !== 'CANCELLED'
        );
      })
      .reduce((acc, o) => acc + (o.totalAmount || 0), 0) || 0
    , [orders]);

  const totalRevenue = pendingData?.totalRevenue || 0;
  const platformCommission = pendingData?.totalCommission || 0;
  const netEarnings = pendingData?.netPayout || 0;

  const isOpen = profile?.status === ShopStatus.OPEN;
  const isSuspended = profile?.status === ShopStatus.SUSPENDED;

  const statusLabel = useMemo(() =>
    isOpen
      ? t('dashboard.open')
      : isSuspended
        ? t('dashboard.suspended')
        : t('dashboard.closed')
    , [isOpen, isSuspended, t]);

  const statusColor = useMemo(() =>
    isOpen
      ? theme.colors.success
      : isSuspended
        ? theme.colors.warning
        : theme.colors.error
    , [isOpen, isSuspended]);

  return {
    t,
    profile,
    profileLoading: profileLoading || earningsLoading,
    toggleStatus,
    isUpdatingStatus,
    activeOrdersCount,
    todaySales,
    totalRevenue,
    platformCommission,
    netEarnings,
    productsCount: products?.length || 0,
    isOpen,
    statusLabel,
    statusColor,
  };
};

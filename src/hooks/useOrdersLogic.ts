import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { useOrders } from './useOrders';
import { useCallback } from 'react';

export const useOrdersLogic = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { orders, isLoading } = useOrders();

  const getStatusConfig = useCallback((status: string) => {
    switch (status.toUpperCase()) {
      case 'DRAFT': return { color: theme.colors.textMuted, label: t('orders.status_draft') };
      case 'PENDING': return { color: theme.colors.warning, label: t('orders.status_pending') };
      case 'CONFIRMED': return { color: theme.colors.info, label: t('orders.status_confirmed') };
      case 'PROPOSAL_SENT': return { color: '#f97316', label: t('orders.status_proposal_sent') };
      case 'PREPARING': return { color: theme.colors.primary, label: t('orders.status_preparing') };
      case 'READY': return { color: '#0891b2', label: t('orders.status_ready') };
      case 'PICKED_UP': return { color: theme.colors.secondary, label: t('orders.status_picked_up') };
      case 'ON_THE_WAY': return { color: '#7c3aed', label: t('orders.status_on_the_way') };
      case 'DELIVERED': return { color: theme.colors.success, label: t('orders.status_delivered') };
      case 'CANCELLED': return { color: theme.colors.error, label: t('orders.status_cancelled') };
      default: return { color: theme.colors.textMuted, label: status };
    }
  }, [t]);

  return {
    t,
    isRTL,
    orders,
    isLoading,
    getStatusConfig,
  };
};

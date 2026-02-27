import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VendorService } from '../services/api/vendorService';
import { ShopStatus } from '@city-market/shared';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export const useVendorProfile = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: VendorService.getProfile,
  });

  const statusMutation = useMutation({
    mutationFn: (status: ShopStatus) => {
      if (!profile?.id) throw new Error('No vendor ID');
      return VendorService.updateStatus(profile.id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProfile'] });
      Toast.show({ 
        type: 'success', 
        text1: t('common.save'), 
        text2: t('dashboard.shop_status_updated') 
      });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: t('common.error') });
    }
  });

  const toggleStatus = () => {
    if (!profile) return;
    const newStatus = profile.status === ShopStatus.OPEN ? ShopStatus.CLOSED : ShopStatus.OPEN;
    statusMutation.mutate(newStatus);
  };

  return {
    profile,
    isLoading,
    error,
    toggleStatus,
    isUpdatingStatus: statusMutation.isPending
  };
};

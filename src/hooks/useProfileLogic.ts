import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../app/AuthContext';
import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { apiErrorMessage } from '@city-market/mobile-ui';
import { VendorService } from '../services/api/vendorService';
import { applyLanguage } from '../locales/i18n';

export const useProfileLogic = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { signOut, signOutAllDevices, vendor, user, refreshProfile } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [mapVisible, setMapVisible] = useState(false);

  const toggleLanguage = useCallback(async () => {
    const needsRestart = await applyLanguage(isRTL ? 'en' : 'ar');
    if (needsRestart) {
      Toast.show({ type: 'info', text1: t('profile.language'), text2: t('profile.restart_to_apply'), autoHide: false });
    }
  }, [isRTL, t]);

  const navigateToReviews = useCallback(() => {
    navigation.navigate('Reviews');
  }, [navigation]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => VendorService.updateProfile(vendor?.id || '', data),
    onSuccess: async () => {
      await refreshProfile();
      Toast.show({
        type: 'success',
        text1: t('profile.update_success'),
      });
    },
    onError: (err: unknown) => {
      Toast.show({
        type: 'error',
        text1: t('profile.update_error'),
        text2: apiErrorMessage(err),
      });
    },
  });

  const updateStoreLocation = useCallback((data: { address: string; latitude: number; longitude: number }) => {
    updateMutation.mutate({
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }, [updateMutation]);

  return {
    t,
    isRTL,
    signOut,
    signOutAllDevices,
    vendor,
    user,
    toggleLanguage,
    navigateToReviews,
    mapVisible,
    setMapVisible,
    updateStoreLocation,
    isUpdating: updateMutation.isPending,
  };
};

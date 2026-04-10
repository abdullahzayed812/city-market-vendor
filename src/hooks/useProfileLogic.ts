import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../app/AuthContext';
import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { VendorService } from '../services/api/vendorService';

export const useProfileLogic = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { signOut, vendor, user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [mapVisible, setMapVisible] = useState(false);

  const toggleLanguage = useCallback(() => {
    i18n.changeLanguage(isRTL ? 'en' : 'ar');
  }, [isRTL, i18n]);

  const navigateToReviews = useCallback(() => {
    navigation.navigate('Reviews');
  }, [navigation]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => VendorService.updateProfile(vendor?.id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      Toast.show({
        type: 'success',
        text1: t('profile.update_success') || 'Profile Updated',
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('profile.update_error') || 'Failed to update profile',
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

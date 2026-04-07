import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../app/AuthContext';
import { useCallback } from 'react';

export const useProfileLogic = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { signOut, vendor, user } = useAuth();
  const isRTL = i18n.language === 'ar';

  const toggleLanguage = useCallback(() => {
    i18n.changeLanguage(isRTL ? 'en' : 'ar');
  }, [isRTL, i18n]);

  const navigateToReviews = useCallback(() => {
    navigation.navigate('Reviews');
  }, [navigation]);

  return {
    t,
    isRTL,
    signOut,
    vendor,
    user,
    toggleLanguage,
    navigateToReviews,
  };
};

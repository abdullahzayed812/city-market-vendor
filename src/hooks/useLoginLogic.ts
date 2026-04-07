import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useAuth } from '../app/AuthContext';
import { AuthService } from '../services/api/authService';
import { UserRole } from '@city-market/shared';

export const useLoginLogic = () => {
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('supermarket1@citymarket.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const isRTL = i18n.language === 'ar';

  const quickVendors = [
    { name: t("vendors.madinaty_supermarket"), email: "supermarket1@citymarket.com" },
    { name: t("vendors.al_jazira_supermarket"), email: "supermarket2@citymarket.com" },
    { name: t("vendors.moataz_pharmacy"), email: "pharmacy@citymarket.com" },
    { name: t("vendors.el_madina_bakery"), email: "bakery@citymarket.com" },
    { name: t("vendors.al_radwa_butcher"), email: "butcher@citymarket.com" },
    { name: t("vendors.al_hakeem_poultry"), email: "poultry@citymarket.com" },
    { name: t("vendors.al_hakeem_fish"), email: "fish@citymarket.com" },
    { name: t("vendors.sanaqreh"), email: "sanaqreh@citymarket.com" },
    { name: t("vendors.ahmed_yehia"), email: "ahmed_yehia@citymarket.com" },
    { name: t("vendors.sabawi"), email: "sabawi@citymarket.com" },
    { name: t("vendors.abdullah_butcher"), email: "abdullah_butcher@citymarket.com" },
    { name: t("vendors.beheiry_poultry"), email: "beheiry_poultry@citymarket.com" },
    { name: t("vendors.ghanem_fish"), email: "ghanem_fish@citymarket.com" },
    { name: t("vendors.mutawakkil_fish"), email: "mutawakkil_fish@citymarket.com" },
    { name: t("vendors.abu_youssef_fish"), email: "abu_youssef_fish@citymarket.com" },
    { name: t("vendors.bondoqa"), email: "bondoqa@citymarket.com" },
    { name: t("vendors.ashri"), email: "ashri@citymarket.com" },
    { name: t("vendors.lozina"), email: "lozina@citymarket.com" },
    { name: t("vendors.al_baraka_bakery"), email: "al_baraka_bakery@citymarket.com" },
    { name: t("vendors.abu_omar"), email: "abu_omar@citymarket.com" },
    { name: t("vendors.rawan"), email: "rawan@citymarket.com" },
    { name: t("vendors.shady_library"), email: "shady_library@citymarket.com" },
    { name: t("vendors.awlad_ragab"), email: "awlad_ragab@citymarket.com" },
    { name: t("vendors.mazaare_al_kheir"), email: "mazaare_al_kheir@citymarket.com" },
  ];

  const handleLogin = useCallback(async (loginEmail?: string, loginPass?: string) => {
    const finalEmail = loginEmail || email;
    const finalPass = loginPass || password;

    if (!finalEmail || !finalPass) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('auth.error_fill_fields'),
      });
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.login({ email: finalEmail, password: finalPass });
      
      if (data.user?.role !== UserRole.VENDOR) {
        throw new Error(t('auth.unauthorized_vendor'));
      }

      await signIn(data.user, data.accessToken, data.refreshToken);
      Toast.show({ type: 'success', text1: t('common.welcome_back') });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || t('auth.error_login_failed'),
      });
    } finally {
      setLoading(false);
    }
  }, [email, password, t, signIn]);

  return {
    t,
    isRTL,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    quickVendors,
    handleLogin,
  };
};

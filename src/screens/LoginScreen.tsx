import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Store, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useAuth } from '../app/AuthContext';
import { AuthService } from '../services/api/authService';
import Toast from 'react-native-toast-message';
import { UserRole } from '@city-market/shared';

const LoginScreen = () => {
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

  const handleLogin = async (loginEmail?: string, loginPass?: string) => {
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBanner} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginCard}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Store size={40} color={theme.colors.white} />
              </View>
              <Text style={styles.title}>{t('auth.login_title')}</Text>
              <Text style={styles.subtitle}>{t('auth.login_subtitle')}</Text>
            </View>

            <View style={styles.form}>
              <View style={[styles.inputLabelContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              </View>
              <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Mail
                  size={20}
                  color={theme.colors.textLight}
                  style={isRTL ? styles.inputIconAr : styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={t('auth.email_placeholder')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={theme.colors.textLight}
                />
              </View>

              <View style={[styles.inputLabelContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              </View>
              <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Lock
                  size={20}
                  color={theme.colors.textLight}
                  style={isRTL ? styles.inputIconAr : styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor={theme.colors.textLight}
                />
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => handleLogin()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>
                      {t('common.login')}
                    </Text>
                    <ChevronRight
                      size={20}
                      color={theme.colors.white}
                      style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.quickLoginSection}>
              <View style={styles.quickLoginDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.quick_login_title')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={[styles.quickLoginGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {quickVendors.map((v) => (
                  <TouchableOpacity
                    key={v.email}
                    style={styles.quickLoginChip}
                    onPress={() => {
                      setEmail(v.email);
                      handleLogin(v.email, 'password123');
                    }}
                  >
                    <Store size={12} color={theme.colors.primary} />
                    <Text style={[styles.quickLoginChipText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <Text style={styles.footerText}>
            {t('auth.merchant_portal')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  loginCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 32,
    padding: theme.spacing.xl,
    marginTop: 40,
    ...theme.shadows.medium,
  },
  header: { alignItems: 'center', marginBottom: 25 },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    ...theme.shadows.medium,
  },
  title: { fontSize: 24, fontWeight: theme.typography.weights.bold, color: theme.colors.secondary },
  subtitle: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4, textAlign: 'center' },
  form: { width: '100%' },
  inputLabelContainer: { marginBottom: 6, paddingHorizontal: 4 },
  inputLabel: { fontSize: 12, fontWeight: theme.typography.weights.bold, color: theme.colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: { marginRight: 10 },
  inputIconAr: { marginLeft: 10 },
  input: { flex: 1, height: 50, color: theme.colors.secondary, fontSize: 14, fontWeight: theme.typography.weights.medium },
  loginButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...theme.shadows.medium,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    marginHorizontal: 6,
  },
  quickLoginSection: {
    marginTop: 10,
  },
  quickLoginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickLoginGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickLoginChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
    width: '48%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickLoginChipText: {
    marginHorizontal: 6,
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: theme.typography.weights.semibold,
    flex: 1,
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(0,0,0,0.3)',
    marginTop: 25,
    fontSize: 11,
    fontWeight: theme.typography.weights.medium,
  }
});

export default LoginScreen;

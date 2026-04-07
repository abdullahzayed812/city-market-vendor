import React from 'react';
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
import { Mail, Lock, Store, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useLoginLogic } from '../hooks/useLoginLogic';

const QuickLoginChip = React.memo(({ vendor, onLogin, setEmail }: any) => (
  <TouchableOpacity
    key={vendor.email}
    style={styles.quickLoginChip}
    onPress={() => {
      setEmail(vendor.email);
      onLogin(vendor.email, 'password123');
    }}
  >
    <Text style={styles.quickLoginText}>{vendor.name}</Text>
  </TouchableOpacity>
));

const LoginScreen = () => {
  const {
    t,
    isRTL,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    quickVendors,
    handleLogin,
  } = useLoginLogic();

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
                  <QuickLoginChip 
                    key={v.email} 
                    vendor={v} 
                    onLogin={handleLogin} 
                    setEmail={setEmail} 
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.primary },
  topBanner: {
    height: 200,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loginCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    borderRadius: 30,
    padding: 30,
    ...theme.shadows.medium,
  },
  header: { alignItems: 'center', marginBottom: 30 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...theme.shadows.medium,
  },
  title: {
    fontSize: 26,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  form: { width: '100%' },
  inputLabelContainer: { width: '100%', marginBottom: 8, paddingHorizontal: 4 },
  inputLabel: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  inputWrapper: {
    width: '100%',
    height: 56,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: { marginEnd: 12 },
  inputIconAr: { marginStart: 12 },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: theme.colors.secondary,
  },
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...theme.shadows.medium,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    marginEnd: 10,
  },
  quickLoginSection: { marginTop: 30 },
  quickLoginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: theme.typography.weights.medium,
  },
  quickLoginGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickLoginChip: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickLoginText: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: theme.typography.weights.medium,
  },
});

export default LoginScreen;

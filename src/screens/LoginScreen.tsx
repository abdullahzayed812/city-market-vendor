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
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('supermarket1@citymarket.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const isRTL = i18n.language === 'ar';

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('auth.error_fill_fields'),
      });
      return;
    }

    setLoading(true);
    try {
      await signIn({ email, password });
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
              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Mail
                  size={20}
                  color={theme.colors.textLight}
                  style={styles.inputIcon}
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

              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Lock
                  size={20}
                  color={theme.colors.textLight}
                  style={styles.inputIcon}
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
                onPress={handleLogin}
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
                    />
                  </>
                )}
              </TouchableOpacity>
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
    height: '40%',
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loginCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 32,
    padding: theme.spacing.xl,
    ...theme.shadows.medium,
  },
  header: { alignItems: 'center', marginBottom: 30 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...theme.shadows.medium,
  },
  title: { fontSize: 26, fontWeight: theme.typography.weights.bold, color: theme.colors.secondary },
  subtitle: { fontSize: 14, color: theme.colors.textMuted, marginTop: 8, textAlign: 'center' },
  form: { width: '100%' },
  inputLabelContainer: { marginBottom: 8, marginStart: 4 },
  inputLabel: { fontSize: 13, fontWeight: theme.typography.weights.bold, color: theme.colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: { marginEnd: 12 },
  input: { flex: 1, height: 56, color: theme.colors.secondary, fontSize: 15, fontWeight: theme.typography.weights.medium },
  loginButton: {
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: 18,
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
    marginEnd: 8,
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(0,0,0,0.3)',
    marginTop: 30,
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
  }
});

export default LoginScreen;

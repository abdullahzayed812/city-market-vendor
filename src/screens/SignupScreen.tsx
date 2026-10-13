import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { AppText as Text, Button, palette, radii, sizes, space, elevation, apiErrorMessage } from '@city-market/mobile-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Store, Eye, EyeOff } from 'lucide-react-native';
import { AuthService } from '../services/api/authService';
import { useAuth } from '../app/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

// Step 1 of merchant signup: the account. The gate then shows the store application,
// because this account has no store yet.
const SignupScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError(t('onboarding.errors.invalid_email'));
    if (password.length < MIN_PASSWORD) return setError(t('onboarding.errors.password_too_short', { min: MIN_PASSWORD }));
    if (password !== confirm) return setError(t('onboarding.errors.passwords_dont_match'));
    setLoading(true);
    try {
      const data = await AuthService.register({ email: email.trim().toLowerCase(), password });
      await signIn(data.user, data.accessToken, data.refreshToken);
    } catch (err: any) {
      setError(apiErrorMessage(err) ?? t('onboarding.errors.signup_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={palette.primary} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Store size={36} color={palette.primary} />
            </View>
            <Text variant="title" color={palette.white} style={styles.center}>{t('onboarding.signup_title')}</Text>
            <Text variant="body" color={palette.primaryMuted} style={styles.center}>{t('onboarding.signup_subtitle')}</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text variant="caption" color={palette.error}>{error}</Text>
              </View>
            ) : null}

            <Text variant="label" color={palette.text} style={styles.label}>{t('auth.email')}</Text>
            <View style={styles.inputBox}>
              <Mail size={20} color={palette.textMuted} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholderTextColor={palette.textDisabled}
                accessibilityLabel={t('auth.email')}
              />
            </View>

            <Text variant="label" color={palette.text} style={styles.label}>{t('auth.password')}</Text>
            <View style={styles.inputBox}>
              <Lock size={20} color={palette.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                accessibilityLabel={t('auth.password')}
              />
              <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('onboarding.toggle_password')}>
                {showPassword ? <EyeOff size={20} color={palette.textMuted} /> : <Eye size={20} color={palette.textMuted} />}
              </Pressable>
            </View>
            <Text variant="caption" color={palette.textMuted} style={styles.hint}>{t('onboarding.password_hint', { min: MIN_PASSWORD })}</Text>

            <Text variant="label" color={palette.text} style={styles.label}>{t('onboarding.confirm_password')}</Text>
            <View style={styles.inputBox}>
              <Lock size={20} color={palette.textMuted} />
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                accessibilityLabel={t('onboarding.confirm_password')}
              />
            </View>

            <Button label={t('onboarding.create_account')} onPress={submit} loading={loading} size="lg" fullWidth style={styles.submit} />
            <Text variant="caption" color={palette.textMuted} style={[styles.center, styles.hint]}>{t('onboarding.signup_next_steps')}</Text>
            <Button label={t('onboarding.have_account')} variant="ghost" onPress={() => navigation.goBack()} fullWidth style={styles.link} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.primary },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'flex-end' },
  brand: { alignItems: 'center', gap: space.xs, paddingHorizontal: space.xxl, paddingTop: space.huge, paddingBottom: space.xxl },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    marginBottom: space.md,
    ...elevation.raised,
  },
  card: {
    flexGrow: 1,
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.xl + 4,
    borderTopRightRadius: radii.xl + 4,
    paddingHorizontal: space.xxl,
    paddingTop: space.xxl,
    paddingBottom: space.xxxl,
  },
  errorBox: { backgroundColor: palette.errorSoft, borderRadius: radii.sm, padding: space.md, marginBottom: space.sm },
  label: { marginBottom: space.sm, marginTop: space.md },
  hint: { marginTop: space.xs },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    height: sizes.input,
    paddingHorizontal: space.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.background,
  },
  input: { flex: 1, height: '100%', fontSize: 16, color: palette.text, textAlign: 'auto' },
  submit: { marginTop: space.xxl },
  link: { marginTop: space.sm },
});

export default SignupScreen;

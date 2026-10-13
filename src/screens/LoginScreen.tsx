import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AppText as Text, Button, ForwardIcon, palette, radii, sizes, space, elevation } from '@city-market/mobile-ui';
import { Mail, Lock, Store, Eye, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoginLogic } from '../hooks/useLoginLogic';
import { DEMO_MODE, DEMO_PASSWORD } from '../config/demo';

const LoginScreen = ({ navigation }: any) => {
  const { t, email, setEmail, password, setPassword, loading, quickVendors, handleLogin } = useLoginLogic();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const passwordRef = useRef<TextInput>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={palette.primary} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Store size={36} color={palette.primary} />
            </View>
            <Text variant="title" color={palette.white} style={styles.center}>{t('auth.login_title')}</Text>
            <Text variant="body" color={palette.primaryMuted} style={styles.center}>{t('auth.login_subtitle')}</Text>
          </View>

          <View style={styles.card}>
            <Text variant="label" color={palette.text} style={styles.label}>{t('auth.email')}</Text>
            <View style={[styles.inputBox, focused === 'email' && styles.inputFocused]}>
              <Mail size={20} color={focused === 'email' ? palette.primary : palette.textMuted} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.email_placeholder')}
                placeholderTextColor={palette.textDisabled}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                accessibilityLabel={t('auth.email')}
              />
            </View>

            <Text variant="label" color={palette.text} style={styles.label}>{t('auth.password')}</Text>
            <View style={[styles.inputBox, focused === 'password' && styles.inputFocused]}>
              <Lock size={20} color={focused === 'password' ? palette.primary : palette.textMuted} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder={t('auth.password_placeholder')}
                placeholderTextColor={palette.textDisabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => handleLogin()}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                accessibilityLabel={t('auth.password')}
              />
              <Pressable
                onPress={() => setShowPassword(v => !v)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? t('auth.hide_password') : t('auth.show_password')}
              >
                {showPassword ? <EyeOff size={20} color={palette.textMuted} /> : <Eye size={20} color={palette.textMuted} />}
              </Pressable>
            </View>

            <Button
              label={t('common.login')}
              trailingIcon={ForwardIcon}
              onPress={() => handleLogin()}
              loading={loading}
              size="lg"
              fullWidth
              style={styles.submit}
            />

            {/* New merchants: account first, then the store application (admin-reviewed) */}
            <View style={styles.signup}>
              <Text variant="caption" color={palette.textMuted}>{t('onboarding.no_account')}</Text>
              <Button label={t('onboarding.register_store')} variant="ghost" onPress={() => navigation.navigate('Signup')} disabled={loading} />
            </View>

            {/* Seed-vendor shortcuts while DEMO_MODE is on (src/config/demo.ts) */}
            {DEMO_MODE && quickVendors.length > 0 ? (
              <View style={styles.demo}>
                <View style={styles.demoDivider}>
                  <View style={styles.line} />
                  <Text variant="caption" color={palette.textMuted}>{t('auth.quick_login_title')}</Text>
                  <View style={styles.line} />
                </View>
                <View style={styles.demoGrid}>
                  {quickVendors.map(v => (
                    <Pressable
                      key={v.email}
                      disabled={loading}
                      onPress={() => {
                        setEmail(v.email);
                        handleLogin(v.email, DEMO_PASSWORD);
                      }}
                      style={({ pressed }) => [styles.demoChip, pressed && styles.demoChipPressed]}
                    >
                      <Text variant="caption" color={palette.text}>{v.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
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
  brand: { alignItems: 'center', gap: space.xs, paddingHorizontal: space.xxl, paddingTop: space.huge, paddingBottom: space.xxxl },
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
  label: { marginBottom: space.sm, marginTop: space.md },
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
  inputFocused: { borderColor: palette.primary, borderWidth: 1.5, backgroundColor: palette.surface },
  input: { flex: 1, height: '100%', fontSize: 16, color: palette.text, textAlign: 'auto' },
  submit: { marginTop: space.xxl },
  signup: { alignItems: 'center', marginTop: space.lg },
  demo: { marginTop: space.xxl },
  demoDivider: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: palette.borderStrong },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  demoChip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
  },
  demoChipPressed: { backgroundColor: palette.primarySoft },
});

export default LoginScreen;

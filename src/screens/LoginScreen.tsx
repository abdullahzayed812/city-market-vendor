import React, { useState, useEffect } from 'react';
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
import { Mail, Lock, Store, ChevronRight, Server } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useLoginLogic } from '../hooks/useLoginLogic';
import { SERVERS, getServerIP, setServerIP } from '../utils/serverConfig';

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
  const [selectedServer, setSelectedServer] = useState(SERVERS.PC);
  const [customIP, setCustomIP] = useState(SERVERS.PC);

  useEffect(() => {
    const loadServer = async () => {
      const ip = await getServerIP();
      setSelectedServer(ip);
      setCustomIP(ip);
    };
    loadServer();
  }, []);

  const handleServerChange = async (ip: string) => {
    await setServerIP(ip);
    setSelectedServer(ip);
    setCustomIP(ip);
  };

  const handleApplyCustomIP = () => {
    const trimmed = customIP.trim();
    if (trimmed) handleServerChange(trimmed);
  };

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

            {/* Server Selection */}
            <View style={styles.serverContainer}>
              <View style={[styles.serverHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Server size={14} color={theme.colors.primary} />
                <Text style={styles.serverTitle}>Target Server</Text>
              </View>
              <View style={[styles.serverOptions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={[styles.serverOption, selectedServer === SERVERS.PC && styles.serverOptionActive]}
                  onPress={() => handleServerChange(SERVERS.PC)}
                >
                  <Text style={[styles.serverOptionText, selectedServer === SERVERS.PC && styles.serverOptionTextActive]}>PC</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.serverOption, selectedServer === SERVERS.LAPTOP && styles.serverOptionActive]}
                  onPress={() => handleServerChange(SERVERS.LAPTOP)}
                >
                  <Text style={[styles.serverOptionText, selectedServer === SERVERS.LAPTOP && styles.serverOptionTextActive]}>Laptop</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.customIPRow}>
                <TextInput
                  style={styles.customIPInput}
                  value={customIP}
                  onChangeText={setCustomIP}
                  placeholder="192.168.0.x"
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleApplyCustomIP}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.customIPApply} onPress={handleApplyCustomIP}>
                  <Text style={styles.customIPApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
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
  serverContainer: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  serverHeader: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  serverTitle: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  serverOptions: {
    gap: 8,
  },
  serverOption: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  serverOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  serverOptionText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textLight,
  },
  serverOptionTextActive: {
    color: theme.colors.white,
  },
  customIPRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  customIPInput: {
    flex: 1,
    height: 38,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: theme.colors.secondary,
  },
  customIPApply: {
    height: 38,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customIPApplyText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.white,
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

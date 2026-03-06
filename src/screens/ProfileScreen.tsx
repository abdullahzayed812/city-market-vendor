import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../app/AuthContext';
import { User, LogOut, Globe, Clock, ChevronRight, Settings, ShieldCheck, Star } from 'lucide-react-native';
import { theme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '../components/common/CustomHeader';

const ProfileScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { signOut, vendor } = useAuth();
  const isRTL = i18n.language === 'ar';

  const ProfileItem = ({ icon: Icon, label, value, onPress, isLast = false, color = theme.colors.primary }: any) => (
    <TouchableOpacity
      style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconBadge, { backgroundColor: color + '10' }]}>
          <Icon size={20} color={color} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {onPress && <ChevronRight size={18} color={theme.colors.textLight} style={isRTL && { transform: [{ rotate: '180deg' }] }} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CustomHeader title={t('profile.title')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{vendor?.shopName?.charAt(0) || t('common.vendor').charAt(0)}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color={theme.colors.white} />
            </View>
          </View>
          <Text style={styles.vendorName}>{vendor?.shopName || t('common.vendor')}</Text>
          <Text style={styles.vendorEmail}>{vendor?.email}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>{t('profile.vendor_id')}: #{vendor?.id?.slice(-8).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account_settings')}</Text>
          <View style={styles.menuGroup}>
            <ProfileItem icon={User} label={t('profile.owner_name')} value={vendor?.ownerName} />
            <ProfileItem
              icon={Star}
              label={t('profile.reviews')}
              value={vendor?.averageRating?.toFixed(1) || '0.0'}
              onPress={() => navigation.navigate('Reviews')}
            />
            <ProfileItem icon={Clock} label={t('profile.working_hours')} value="09:00 - 21:00" onPress={() => { }} />
            <ProfileItem
              icon={Globe}
              label={t('profile.language')}
              value={isRTL ? t('profile.arabic') : t('profile.english')}
              onPress={() => i18n.changeLanguage(isRTL ? 'en' : 'ar')}
              isLast={true}
              color={theme.colors.info}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.app_preferences')}</Text>
          <View style={styles.menuGroup}>
            <ProfileItem icon={Settings} label={t('profile.push_notifications')} value={t('dashboard.open')} onPress={() => { }} />
            <ProfileItem icon={ShieldCheck} label={t('profile.security_privacy')} onPress={() => { }} isLast={true} color={theme.colors.success} />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>{t('profile.version', { version: '1.2.0 (Build 45)' })}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  profileHeader: { alignItems: 'center', paddingVertical: 30, backgroundColor: theme.colors.surface },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  avatarText: { color: theme.colors.white, fontSize: 42, fontWeight: theme.typography.weights.black },
  vendorName: { fontSize: 24, fontWeight: theme.typography.weights.bold, color: theme.colors.secondary },
  vendorEmail: { fontSize: 14, color: theme.colors.textLight, marginTop: 4 },
  idBadge: { backgroundColor: theme.colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  idBadgeText: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textMuted },
  section: { marginTop: 25, paddingHorizontal: theme.spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: theme.typography.weights.bold, color: theme.colors.textLight, textTransform: 'uppercase', marginBottom: 10, marginStart: 4, letterSpacing: 0.5 },
  menuGroup: { backgroundColor: theme.colors.surface, borderRadius: 24, overflow: 'hidden', ...theme.shadows.card },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 12
  },
  menuLabel: { fontSize: 16, color: theme.colors.secondary, fontWeight: theme.typography.weights.semibold },
  menuItemRight: { flexDirection: 'row', alignItems: 'center' },
  menuValue: { fontSize: 14, color: theme.colors.textMuted, marginEnd: 8 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 18,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: 24,
    ...theme.shadows.card,
  },
  logoutText: { marginStart: 10, color: theme.colors.error, fontWeight: 'bold', fontSize: 16 },
  versionText: { textAlign: 'center', color: theme.colors.textLight, fontSize: 12, marginTop: 30, marginBottom: 40 },
});

export default ProfileScreen;

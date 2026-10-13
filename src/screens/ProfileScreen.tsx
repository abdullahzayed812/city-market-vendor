import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
  AppText as Text,
  Card,
  Button,
  ForwardIcon,
  palette,
  radii,
  space,
} from '@city-market/mobile-ui';
import { User, LogOut, Globe, Star, MapPin, Phone, type LucideIcon } from 'lucide-react-native';
import Config from 'react-native-config';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomHeader from '../components/common/CustomHeader';
import ImageWithPlaceholder from '../components/common/ImageWithPlaceholder';
import { useProfileLogic } from '../hooks/useProfileLogic';
import StoreMapPickerModal from '../components/StoreMapPickerModal';

interface RowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

const Row = ({ icon: Icon, label, value, trailing, onPress, isLast }: RowProps) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    style={({ pressed }) => [styles.row, !isLast && styles.rowDivider, pressed && styles.rowPressed]}
  >
    <View style={styles.rowIcon}>
      <Icon size={20} color={palette.primary} />
    </View>
    <View style={styles.flex}>
      <Text variant="caption" color={palette.textMuted}>{label}</Text>
      {value ? <Text variant="bodyStrong" color={palette.text} numberOfLines={2}>{value}</Text> : null}
    </View>
    {trailing}
    {onPress ? <ForwardIcon size={18} color={palette.textMuted} /> : null}
  </Pressable>
);

export const GOOGLE_MAPS_API_KEY = Config.GOOGLE_MAPS_API_KEY ?? '';

const ProfileScreen = () => {
  const {
    t,
    isRTL,
    signOut,
    signOutAllDevices,
    vendor,
    user,
    toggleLanguage,
    navigateToReviews,
    mapVisible,
    setMapVisible,
    updateStoreLocation,
    isUpdating,
  } = useProfileLogic();

  const confirmLogoutAll = () =>
    Alert.alert(t('profile.logout_all_confirm_title'), t('profile.logout_all_confirm_message'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout_all_devices'), style: 'destructive', onPress: signOutAllDevices },
    ]);

  const shopName = vendor?.shopName || t('common.vendor');
  const ratingValue =
    vendor?.totalRatings > 0
      ? `${Number(vendor.averageRating ?? 0).toFixed(1)} · ${t('profile.reviews_count', { count: vendor.totalRatings })}`
      : t('reviews.no_reviews');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomHeader title={t('profile.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.identity}>
          {vendor?.storeImage ? (
            <ImageWithPlaceholder uri={vendor.storeImage} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text variant="title" color={palette.primary}>{shopName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.flex}>
            <Text variant="heading" color={palette.text} numberOfLines={2}>{shopName}</Text>
            {user?.email ? <Text variant="caption" color={palette.textMuted} numberOfLines={1}>{user.email}</Text> : null}
          </View>
        </Card>

        <Text variant="label" color={palette.textSecondary} style={styles.sectionTitle}>{t('profile.store_info')}</Text>
        <Card padded={false}>
          <Row icon={User} label={t('profile.owner_name')} value={vendor?.ownerName || t('profile.not_set')} />
          <Row icon={Phone} label={t('profile.phone')} value={vendor?.phone || t('profile.not_set')} />
          <Row icon={Star} label={t('profile.reviews')} value={ratingValue} onPress={navigateToReviews} />
          <Row
            icon={MapPin}
            label={t('profile.store_location')}
            value={vendor?.address || t('profile.not_set')}
            trailing={isUpdating ? <ActivityIndicator size="small" color={palette.primary} /> : null}
            onPress={isUpdating ? undefined : () => setMapVisible(true)}
            isLast
          />
        </Card>

        <Text variant="label" color={palette.textSecondary} style={styles.sectionTitle}>{t('profile.app_preferences')}</Text>
        <Card padded={false}>
          <Row
            icon={Globe}
            label={t('profile.language')}
            value={isRTL ? t('profile.arabic') : t('profile.english')}
            onPress={toggleLanguage}
            isLast
          />
        </Card>

        <Text variant="label" color={palette.textSecondary} style={styles.sectionTitle}>{t('profile.account')}</Text>
        <View style={styles.logout}>
          <Button label={t('common.logout')} icon={LogOut} variant="dangerOutline" onPress={signOut} fullWidth />
          <Button label={t('common.logout_all_devices')} variant="ghost" onPress={confirmLogoutAll} fullWidth />
        </View>

        <Text variant="caption" color={palette.textMuted} style={styles.version}>
          {t('profile.version', { version: `${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})` })}
        </Text>
      </ScrollView>

      <StoreMapPickerModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={updateStoreLocation}
        googleApiKey={GOOGLE_MAPS_API_KEY}
        initialLocation={vendor?.latitude ? { latitude: vendor.latitude, longitude: vendor.longitude } : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: space.lg, paddingBottom: space.huge },
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: { width: 64, height: 64, borderRadius: radii.lg },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primarySoft },
  sectionTitle: { marginTop: space.xl, marginBottom: space.sm, paddingHorizontal: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  rowPressed: { backgroundColor: palette.surfaceMuted },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primarySoft,
  },
  logout: { gap: space.sm },
  version: { textAlign: 'center', marginTop: space.xl },
});

export default ProfileScreen;

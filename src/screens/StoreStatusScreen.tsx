import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { AppText as Text, Button, palette, radii, space } from '@city-market/mobile-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, Ban, XCircle, LogOut, RefreshCw, PencilLine } from 'lucide-react-native';
import { EventType, Vendor, VendorApprovalStatus } from '@city-market/shared';
import { useAuth } from '../app/AuthContext';
import { useSocket } from '../app/SocketContext';

// Store waiting for review, rejected (with the admin's reason) or suspended. The gate swaps
// it for the app once the store is approved.
const StoreStatusScreen = ({ vendor, refetch, refreshing, onEdit }: { vendor: Vendor; refetch: () => void; refreshing: boolean; onEdit: () => void }) => {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const status = vendor.approvalStatus ?? VendorApprovalStatus.PENDING_REVIEW;

  // The admin's decision is pushed to user:<id>; refetch so the gate reacts at once
  useEffect(() => {
    if (!socket) return;
    const onDecision = () => queryClient.invalidateQueries({ queryKey: ['myVendor'] });
    socket.on(EventType.VENDOR_APPROVAL_UPDATED, onDecision);
    return () => {
      socket.off(EventType.VENDOR_APPROVAL_UPDATED, onDecision);
    };
  }, [socket, queryClient]);

  const look =
    status === VendorApprovalStatus.REJECTED
      ? { Icon: XCircle, fg: palette.error, bg: palette.errorSoft }
      : status === VendorApprovalStatus.SUSPENDED
        ? { Icon: Ban, fg: palette.error, bg: palette.errorSoft }
        : { Icon: Clock, fg: palette.warning, bg: palette.warningSoft };
  const key = status.toLowerCase();
  const canEdit = status === VendorApprovalStatus.PENDING_REVIEW || status === VendorApprovalStatus.REJECTED;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}>
        <View style={[styles.iconCircle, { backgroundColor: look.bg }]}>
          <look.Icon size={44} color={look.fg} />
        </View>
        <Text variant="title" color={palette.text} style={styles.center}>{t(`onboarding.status.${key}_title`)}</Text>
        <Text variant="bodyStrong" color={palette.primary} style={styles.center}>{vendor.shopName}</Text>
        <Text variant="body" color={palette.textMuted} style={[styles.center, styles.body]}>{t(`onboarding.status.${key}_body`)}</Text>

        {vendor.reviewNote && status !== VendorApprovalStatus.PENDING_REVIEW ? (
          <View style={styles.reason}>
            <Text variant="label" color={palette.error}>{t('onboarding.status.reason')}</Text>
            <Text variant="body" color={palette.text}>{vendor.reviewNote}</Text>
          </View>
        ) : null}
        {vendor.submittedAt ? (
          <Text variant="caption" color={palette.textMuted} style={styles.center}>
            {t('onboarding.status.submitted_at', { date: new Date(vendor.submittedAt).toLocaleString(i18n.language) })}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {canEdit ? (
            <Button
              label={t(status === VendorApprovalStatus.REJECTED ? 'onboarding.status.fix_and_resubmit' : 'onboarding.status.edit_application')}
              icon={PencilLine}
              onPress={onEdit}
              fullWidth
            />
          ) : null}
          <Button label={t('onboarding.status.check_status')} icon={RefreshCw} variant="outline" onPress={refetch} loading={refreshing} fullWidth />
          <Button label={t('common.logout')} icon={LogOut} variant="ghost" onPress={signOut} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  container: { padding: space.xxl, alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
  center: { textAlign: 'center' },
  iconCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: space.xl },
  body: { marginTop: space.md, marginBottom: space.lg },
  reason: { alignSelf: 'stretch', backgroundColor: palette.errorSoft, borderRadius: radii.md, padding: space.lg, gap: space.xs, marginBottom: space.lg },
  actions: { alignSelf: 'stretch', gap: space.md, marginTop: space.xl },
});

export default StoreStatusScreen;

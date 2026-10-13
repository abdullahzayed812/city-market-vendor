import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
} from 'react-native';
import {
  AppText as Text,
  Card,
  SectionHeader,
  StatusBadge,
  SummaryRow,
  Button,
  IconButton,
  LoadingState,
  palette,
  radii,
  space,
  sizes,
  shortId,
  type Tone,
} from '@city-market/mobile-ui';
import { Check, Minus, Plus, X, Send, XCircle, Timer, FilePen, Info, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TFunction } from 'i18next';
import { VendorOrderStatus, ProposalStatus, ProposalType } from '@city-market/shared';
import CustomHeader from '../components/common/CustomHeader';
import QueryError from '../components/common/QueryError';
import { useOrderDetailsLogic } from '../hooks/useOrderDetailsLogic';
import { useFormat } from '../hooks/useFormat';
import type { SlaCountdownResult } from '../hooks/useSlaCountdown';
import { vendorOrderStatusMeta, vendorOrderStatusKey } from '../features/orderStatus';

/** "Before → after" arrow pointing in reading direction. */
const ChangeArrow = I18nManager.isRTL ? ArrowLeft : ArrowRight;

const PROPOSAL_TONE: Record<string, Tone> = {
  [ProposalStatus.PENDING]: 'info',
  [ProposalStatus.ACCEPTED]: 'success',
  [ProposalStatus.REJECTED]: 'error',
};

const Countdown = ({ label, countdown }: { label: string; countdown: SlaCountdownResult }) => {
  if (countdown.isExpired || countdown.remainingSeconds <= 0) return null;
  const fg = countdown.isWarning ? palette.error : palette.warning;
  return (
    <View style={[styles.countdown, { backgroundColor: countdown.isWarning ? palette.errorSoft : palette.warningSoft }]}>
      <Timer size={20} color={fg} />
      <Text variant="label" color={fg} style={styles.flex}>{label}</Text>
      <Text variant="title" color={fg} style={styles.tabular}>{countdown.formattedTime}</Text>
    </View>
  );
};

interface ItemRowProps {
  item: any;
  proposal?: any;
  t: TFunction;
  money: (n: number | null | undefined) => string;
  weight: (g: number | null | undefined) => string;
  isLast: boolean;
}

const ItemRow = React.memo(({ item, proposal, t, money, weight, isLast }: ItemRowProps) => {
  const isWeighted = !item.quantity;
  const requested = isWeighted ? `≈ ${weight(item.requestedWeightGrams)}` : `× ${item.quantity}`;

  let proposedValue: string | null = null;
  if (proposal) {
    if (proposal.type === ProposalType.UNAVAILABLE) proposedValue = t('orders.unavailable');
    else if (proposal.type === ProposalType.QUANTITY_REDUCTION) proposedValue = `× ${proposal.proposedQuantity}`;
    else if (proposal.type === ProposalType.WEIGHT_ADJUSTMENT) proposedValue = weight(proposal.proposedWeightGrams);
  }

  return (
    <View style={[styles.itemRow, !isLast && styles.itemDivider]}>
      <View style={styles.itemMain}>
        <Text variant="bodyStrong" color={palette.text} style={styles.flex}>
          {item.productName}
        </Text>
        <Text variant="bodyStrong" color={palette.text} style={styles.tabular}>{requested}</Text>
      </View>
      <View style={styles.itemMeta}>
        <Text variant="caption" color={palette.textMuted}>
          {t('orders.unit_price')}: {money(item.unitPrice)}
        </Text>
        {isWeighted && item.actualWeightGrams ? (
          <Text variant="caption" color={palette.textSecondary}>
            {t('orders.actual_weight')}: {weight(item.actualWeightGrams)}
          </Text>
        ) : null}
      </View>
      {proposedValue ? (
        <View style={styles.proposalLine}>
          <Text variant="caption" color={palette.textMuted} style={styles.strike}>{requested}</Text>
          <ChangeArrow size={14} color={palette.textMuted} />
          <Text variant="label" color={palette.text}>{proposedValue}</Text>
          <StatusBadge
            size="sm"
            tone={PROPOSAL_TONE[proposal.status] ?? 'neutral'}
            label={t(`orders.proposal_${String(proposal.status).toLowerCase()}`)}
            style={styles.pushEnd}
          />
        </View>
      ) : null}
    </View>
  );
});

const ProposalSheet = ({
  visible,
  onClose,
  t,
  order,
  proposalData,
  handleUpdateProposal,
  onSubmit,
  isProcessing,
  weight,
  kg,
}: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <View style={styles.flex}>
            <Text variant="heading" color={palette.text}>{t('orders.propose_changes')}</Text>
            <Text variant="caption" color={palette.textMuted}>{t('orders.proposal_sheet_hint')}</Text>
          </View>
          <IconButton icon={X} onPress={onClose} accessibilityLabel={t('common.cancel')} variant="soft" size={40} />
        </View>

        <ScrollView style={styles.sheetBody} contentContainerStyle={styles.sheetBodyContent} keyboardShouldPersistTaps="handled">
          {order?.items.map((item: any) => {
            const data = proposalData[item.id] || { isUnavailable: false, newQuantity: item.quantity, newWeightKg: '' };
            const atMax = data.newQuantity >= item.quantity;
            const atMin = (data.newQuantity || 0) <= 0;
            return (
              <View key={item.id} style={[styles.proposalItem, data.isUnavailable && styles.proposalItemOff]}>
                <View style={styles.itemMain}>
                  <Text variant="bodyStrong" color={palette.text} style={styles.flex} numberOfLines={2}>
                    {item.productName}
                  </Text>
                </View>
                <View style={styles.toggleRow}>
                  <Text variant="caption" color={data.isUnavailable ? palette.error : palette.textSecondary} style={styles.flex}>
                    {t('orders.mark_unavailable')}
                  </Text>
                  <Switch
                    value={data.isUnavailable}
                    onValueChange={val => handleUpdateProposal(item.id, { isUnavailable: val })}
                    trackColor={{ true: palette.errorSoft, false: palette.borderStrong }}
                    thumbColor={data.isUnavailable ? palette.error : palette.white}
                    accessibilityLabel={`${t('orders.mark_unavailable')}: ${item.productName}`}
                  />
                </View>

                {!data.isUnavailable &&
                  (item.quantity ? (
                    <View style={styles.inputRow}>
                      <Text variant="caption" color={palette.textMuted} style={styles.flex}>
                        {t('orders.new_qty')} ({t('orders.original_qty')}: {item.quantity})
                      </Text>
                      <View style={styles.stepper}>
                        <IconButton
                          icon={Minus}
                          size={36}
                          variant="plain"
                          iconColor={atMin ? palette.textDisabled : palette.primary}
                          disabled={atMin}
                          onPress={() => handleUpdateProposal(item.id, { newQuantity: Math.max(0, (data.newQuantity || 0) - 1) })}
                          accessibilityLabel="-1"
                        />
                        <Text variant="heading" color={palette.text} style={[styles.tabular, styles.stepValue]}>
                          {data.newQuantity}
                        </Text>
                        <IconButton
                          icon={Plus}
                          size={36}
                          variant="plain"
                          iconColor={atMax ? palette.textDisabled : palette.primary}
                          disabled={atMax}
                          onPress={() => handleUpdateProposal(item.id, { newQuantity: Math.min(item.quantity, (data.newQuantity || 0) + 1) })}
                          accessibilityLabel="+1"
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.inputRow}>
                      <Text variant="caption" color={palette.textMuted} style={styles.flex}>
                        {t('orders.actual_weight')} ({t('orders.requested_weight')}: {weight(item.requestedWeightGrams)})
                      </Text>
                      <View style={styles.weightBox}>
                        <TextInput
                          style={styles.weightInput}
                          keyboardType="decimal-pad"
                          value={data.newWeightKg}
                          onChangeText={text => handleUpdateProposal(item.id, { newWeightKg: text })}
                          accessibilityLabel={`${t('orders.actual_weight')}: ${item.productName}`}
                          selectTextOnFocus
                        />
                        <Text variant="caption" color={palette.textMuted}>{kg}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            );
          })}
        </ScrollView>

        <Button label={t('orders.send_proposal')} icon={Send} onPress={onSubmit} loading={isProcessing} size="lg" fullWidth />
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>
);

const OrderDetailsScreen = ({ route }: any) => {
  const { orderId } = route.params;
  const {
    t,
    order,
    isLoading,
    error,
    refetch,
    isRefetching,
    acceptOrder,
    updateStatus,
    isProposalModalVisible,
    setIsProposalModalVisible,
    proposalData,
    handleUpdateProposal,
    submitProposals,
    canAccept,
    isPreparing,
    isProcessing,
    vendorConfirmationCountdown,
    customerDecisionCountdown,
  } = useOrderDetailsLogic(orderId);
  const { money, weight, kg } = useFormat();

  const header = <CustomHeader title={t('orders.details')} subtitle={order ? shortId(order.id) : undefined} showBack />;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        <QueryError error={error} onRetry={refetch} retrying={isRefetching} />
      </SafeAreaView>
    );
  }

  const meta = vendorOrderStatusMeta(order.status);
  const proposalsByItem = new Map<string, any>((order.proposals ?? []).map((p: any) => [p.vendorOrderItemId, p]));

  const confirmCancel = () =>
    Alert.alert(t('orders.cancel_confirm_title'), t('orders.cancel_confirm_message'), [
      { text: t('orders.keep_order'), style: 'cancel' },
      { text: t('orders.cancel_order'), style: 'destructive', onPress: () => updateStatus({ status: VendorOrderStatus.CANCELLED }) },
    ]);

  const hint = canAccept ? t('orders.pending_hint') : isPreparing ? t('orders.preparing_hint') : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {header}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.primary} colors={[palette.primary]} />
        }
      >
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.flex}>
              <Text variant="caption" color={palette.textMuted}>{t('orders.status')}</Text>
              <Text variant="caption" color={palette.textMuted}>
                {new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </Text>
            </View>
            <StatusBadge label={t(vendorOrderStatusKey(order.status))} tone={meta.tone} icon={meta.icon} />
          </View>
          {canAccept ? <Countdown label={t('orders.confirm_deadline')} countdown={vendorConfirmationCountdown} /> : null}
          {order.status === VendorOrderStatus.PROPOSAL_SENT ? (
            <Countdown label={t('orders.customer_decision_deadline')} countdown={customerDecisionCountdown} />
          ) : null}
          {hint ? (
            <View style={styles.hintRow}>
              <Info size={16} color={palette.info} />
              <Text variant="caption" color={palette.textSecondary} style={styles.flex}>{hint}</Text>
            </View>
          ) : null}
        </Card>

        {order.cancellationReason ? (
          <View style={styles.cancelBanner} accessibilityRole="alert">
            <XCircle size={20} color={palette.error} />
            <View style={styles.flex}>
              <Text variant="label" color={palette.error}>{t('orders.cancellation_reason')}</Text>
              <Text variant="body" color={palette.text}>{order.cancellationReason}</Text>
            </View>
          </View>
        ) : null}

        <SectionHeader
          title={t('orders.order_items')}
          trailing={<Text variant="caption" color={palette.textMuted}>{t('orders.items_count', { count: order.items.length })}</Text>}
          style={styles.sectionGap}
        />
        <Card padded={false}>
          {order.items.map((item: any, i: number) => (
            <ItemRow
              key={item.id}
              item={item}
              proposal={proposalsByItem.get(item.id)}
              t={t}
              money={money}
              weight={weight}
              isLast={i === order.items.length - 1}
            />
          ))}
        </Card>

        <Card>
          <SummaryRow label={t('orders.total_price')} value={money(order.totalAmount)} emphasis="total" />
        </Card>
      </ScrollView>

      {canAccept || isPreparing ? (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {canAccept ? (
            <>
              <Button label={t('orders.cancel_order')} variant="dangerOutline" onPress={confirmCancel} disabled={isProcessing} style={styles.flex} />
              <Button label={t('orders.accept_order')} icon={Check} onPress={() => acceptOrder()} loading={isProcessing} style={styles.flex2} />
            </>
          ) : (
            <>
              <Button
                label={t('orders.propose_changes')}
                icon={FilePen}
                variant="outline"
                onPress={() => setIsProposalModalVisible(true)}
                disabled={isProcessing}
                style={styles.flex}
              />
              <Button
                label={t('orders.confirm_prepared')}
                icon={Check}
                onPress={() => updateStatus({ status: VendorOrderStatus.CONFIRMED })}
                loading={isProcessing}
                style={styles.flex}
              />
            </>
          )}
        </SafeAreaView>
      ) : null}

      <ProposalSheet
        visible={isProposalModalVisible}
        onClose={() => setIsProposalModalVisible(false)}
        t={t}
        order={order}
        proposalData={proposalData}
        handleUpdateProposal={handleUpdateProposal}
        onSubmit={submitProposals}
        isProcessing={isProcessing}
        weight={weight}
        kg={kg}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  scrollContent: { padding: space.lg, gap: space.md, paddingBottom: space.huge },
  flex: { flex: 1 },
  flex2: { flex: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
  pushEnd: { marginStart: 'auto' },
  strike: { textDecorationLine: 'line-through' },
  sectionGap: { marginTop: space.sm, marginBottom: 0 },
  statusCard: { gap: space.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.md,
  },
  cancelBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.lg,
    borderRadius: radii.lg,
    backgroundColor: palette.errorSoft,
  },
  itemRow: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.xs },
  itemDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  itemMain: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md },
  proposalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.xs,
    padding: space.sm,
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceMuted,
  },
  footer: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    backgroundColor: palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: palette.overlay },
  sheet: {
    maxHeight: '90%',
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.md },
  sheetBody: { flexGrow: 0 },
  sheetBodyContent: { gap: space.sm, paddingBottom: space.lg },
  proposalItem: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.borderStrong,
  },
  proposalItemOff: { backgroundColor: palette.errorSoft, borderColor: palette.error },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  stepValue: { minWidth: 32, textAlign: 'center' },
  weightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minWidth: 110,
    height: sizes.touch,
    paddingHorizontal: space.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
  },
  weightInput: { flex: 1, fontSize: 16, color: palette.text, paddingVertical: 0, textAlign: 'center' },
});

export default OrderDetailsScreen;

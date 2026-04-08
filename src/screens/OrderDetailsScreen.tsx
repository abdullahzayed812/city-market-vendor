import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import {
  Check,
  AlertCircle,
  Minus,
  Plus,
  X,
  Trash2,
  Send,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { VendorOrderStatus } from '@city-market/shared';
import CustomHeader from '../components/common/CustomHeader';
import { useOrderDetailsLogic } from '../hooks/useOrderDetailsLogic';

const StatusCard = React.memo(({ t, order }: any) => (
  <View style={styles.statusCard}>
    <Text style={styles.statusLabel}>{t('orders.status')}</Text>
    <View
      style={[
        styles.badge,
        { backgroundColor: theme.colors.primary + '15' },
      ]}
    >
      <Text style={styles.badgeText}>
        {t(`orders.status_${order?.status.toLowerCase()}`)}
      </Text>
    </View>
  </View>
));

const OrderItem = React.memo(({ t, item }: any) => (
  <View key={item.id} style={styles.itemCard}>
    <View style={styles.itemHeader}>
      <Text style={styles.itemName}>{item.productName}</Text>
      <Text style={styles.itemPrice}>
        {t('common.currency')} {item.unitPrice.toFixed(2)}
      </Text>
    </View>

    <View style={styles.itemActions}>
      <View style={styles.quantityContainer}>
        {item.quantity ? (
          <>
            <Text style={styles.qtyLabel}>
              {t('products.quantity')}:
            </Text>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
          </>
        ) : (
          <>
            <Text style={styles.qtyLabel}>{t('orders.weight')}:</Text>
            <Text style={styles.qtyValue}>
              ≈ {(item.requestedWeightGrams / 1000).toFixed(2)} kg
              {item.actualWeightGrams && (
                <Text style={styles.actualWeightLabel}>
                  {' '}
                  ({t('orders.actual_weight') || 'Act'}:{' '}
                  {(item.actualWeightGrams / 1000).toFixed(2)} kg)
                </Text>
              )}
            </Text>
          </>
        )}
      </View>
    </View>
  </View>
));

const ProposalModal = React.memo(({
  visible,
  onClose,
  t,
  order,
  proposalData,
  handleUpdateProposal,
  onSubmit,
  isProcessing,
}: any) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {t('orders.propose_changes')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          {order?.items.map((item: any) => {
            const data = proposalData[item.id] || {
              isUnavailable: false,
              newQuantity: item.quantity,
              newWeightKg: '0',
            };
            return (
              <View key={item.id} style={styles.proposalItemRow}>
                <View style={styles.proposalItemHeader}>
                  <Text style={styles.proposalItemName} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <View style={styles.unavailableToggle}>
                    <Text style={styles.unavailableText}>
                      {t('orders.mark_unavailable')}
                    </Text>
                    <Switch
                      value={data.isUnavailable}
                      onValueChange={val =>
                        handleUpdateProposal(item.id, {
                          isUnavailable: val,
                        })
                      }
                      trackColor={{ true: theme.colors.error }}
                    />
                  </View>
                </View>

                {!data.isUnavailable && (
                  <View style={styles.proposalInputArea}>
                    {item.quantity ? (
                      <View style={styles.qtyProposalContainer}>
                        <Text style={styles.inputLabel}>
                          {t('products.quantity')}:
                        </Text>
                        <View style={styles.qtyControls}>
                          <TouchableOpacity
                            onPress={() =>
                              handleUpdateProposal(item.id, {
                                newQuantity: Math.max(
                                  0,
                                  (data.newQuantity || 0) - 1,
                                ),
                              })
                            }
                            style={styles.qtyBtn}
                          >
                            <Minus size={16} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.qtyValue}>
                            {data.newQuantity}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              handleUpdateProposal(item.id, {
                                newQuantity: Math.min(
                                  item.quantity,
                                  (data.newQuantity || 0) + 1,
                                ),
                              })
                            }
                            style={styles.qtyBtn}
                            disabled={data.newQuantity === item.quantity}
                          >
                            <Plus
                              size={16}
                              color={
                                data.newQuantity === item.quantity
                                  ? theme.colors.border
                                  : theme.colors.primary
                              }
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.originalHint}>
                          / {item.quantity}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.weightProposalContainer}>
                        <Text style={styles.inputLabel}>
                          {t('orders.actual_weight')}:
                        </Text>
                        <View style={styles.weightInputBox}>
                          <TextInput
                            style={styles.weightInput}
                            keyboardType="numeric"
                            value={data.newWeightKg}
                            onChangeText={text =>
                              handleUpdateProposal(item.id, {
                                newWeightKg: text,
                              })
                            }
                          />
                          <Text style={styles.weightUnit}>kg</Text>
                        </View>
                        <Text style={styles.originalHint}>
                          (Req:{' '}
                          {(item.requestedWeightGrams / 1000).toFixed(2)}{' '}
                          kg)
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.modalSubmitBtn, isProcessing && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Send size={18} color={theme.colors.white} style={{ marginEnd: 10 }} />
              <Text style={styles.modalSubmitText}>{t('orders.send_proposal')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
));

const OrderDetailsScreen = ({ route }: any) => {
  const { orderId } = route.params;
  const {
    t,
    order,
    isLoading,
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
  } = useOrderDetailsLogic(orderId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title={t('orders.details')} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <StatusCard t={t} order={order} />

        <Text style={styles.sectionTitle}>{t('orders.order_items')}</Text>
        {order?.items.map((item: any) => (
          <OrderItem key={item.id} t={t} item={item} />
        ))}
      </ScrollView>

      <View style={styles.footerActions}>
        {canAccept ? (
          <View style={styles.footerButtonsRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.error, flex: 1 },
              ]}
              onPress={() =>
                updateStatus({ status: VendorOrderStatus.CANCELLED })
              }
              disabled={isProcessing}
            >
              <Trash2 color={theme.colors.white} size={18} />
              <Text style={styles.buttonTextSmall}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary, flex: 2 },
              ]}
              onPress={() => acceptOrder()}
              disabled={isProcessing}
            >
              <Check color={theme.colors.white} size={20} />
              <Text style={styles.buttonTextSmall}>
                {t('orders.accept_order')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : isPreparing ? (
          <View style={styles.footerButtonsRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.warning, flex: 1 },
              ]}
              onPress={() => setIsProposalModalVisible(true)}
              disabled={isProcessing}
            >
              <AlertCircle color={theme.colors.white} size={18} />
              <Text style={styles.buttonTextSmall}>
                {t('orders.propose_changes')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.success, flex: 1 },
              ]}
              onPress={() =>
                updateStatus({ status: VendorOrderStatus.CONFIRMED })
              }
              disabled={isProcessing}
            >
              <Check color={theme.colors.white} size={18} />
              <Text style={styles.buttonTextSmall}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <ProposalModal
        visible={isProposalModalVisible}
        onClose={() => setIsProposalModalVisible(false)}
        t={t}
        order={order}
        proposalData={proposalData}
        handleUpdateProposal={handleUpdateProposal}
        onSubmit={submitProposals}
        isProcessing={isProcessing}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: theme.spacing.lg },
  statusCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    ...theme.shadows.card,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
    marginBottom: 15,
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    ...theme.shadows.card,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  itemPrice: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  qtyLabel: { fontSize: 13, color: theme.colors.textMuted, marginEnd: 6 },
  qtyValue: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  actualWeightLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  footerActions: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerButtonsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    gap: 6,
  },
  buttonTextSmall: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    maxHeight: '85%',
    padding: 20,
    ...theme.shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
  modalBody: { marginBottom: 20 },
  proposalItemRow: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  proposalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  proposalItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginEnd: 10,
  },
  unavailableToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unavailableText: { fontSize: 11, color: theme.colors.textMuted },
  proposalInputArea: {
    backgroundColor: theme.colors.background,
    padding: 10,
    borderRadius: theme.radius.sm,
  },
  qtyProposalContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weightProposalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputLabel: { fontSize: 13, color: theme.colors.textMuted, minWidth: 80 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
  },
  qtyBtn: { padding: 4 },
  originalHint: { fontSize: 12, color: theme.colors.textMuted },
  weightInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    flex: 1,
  },
  weightInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 15,
    color: theme.colors.text,
  },
  weightUnit: { fontSize: 14, color: theme.colors.textMuted, marginStart: 4 },
  modalSubmitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OrderDetailsScreen;

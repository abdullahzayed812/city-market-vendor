import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProposalType, type ProposeChangesDto } from '@city-market/shared';

interface OrderPreparationModalProps {
    visible: boolean;
    order: any;
    onClose: () => void;
    onSubmit: (proposals: ProposeChangesDto[]) => void;
}

type DraftItem = {
    itemId: string;
    productName: string;
    originalQuantity?: number;
    requestedWeightGrams?: number;
    isUnavailable: boolean;
    newQuantity?: number;
    newWeightGrams?: number;
    newWeightKgString?: string;
};

const normalizeDraftItems = (order: any): DraftItem[] => {
    if (!order?.items) return [];

    return order.items.map((item: any) => ({
        itemId: item.id,
        productName: item.productName,
        originalQuantity: item.quantity,
        requestedWeightGrams: item.requestedWeightGrams,
        isUnavailable: false,
        newQuantity: item.quantity,
        newWeightGrams: item.requestedWeightGrams,
        newWeightKgString: item.requestedWeightGrams ? (item.requestedWeightGrams / 1000).toFixed(2) : '',
    }));
};

const OrderPreparationModal = ({ visible, order, onClose, onSubmit }: OrderPreparationModalProps) => {
    const { t } = useTranslation();
    const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

    useEffect(() => {
        if (visible) {
            setDraftItems(normalizeDraftItems(order));
        }
    }, [visible, order]);

    const onSubmitPress = () => {
        const proposals: ProposeChangesDto[] = draftItems
            .map((item) => {
                if (item.isUnavailable) {
                    return { itemId: item.itemId, type: ProposalType.UNAVAILABLE };
                }

                if (item.originalQuantity !== undefined && item.newQuantity !== undefined && item.newQuantity < item.originalQuantity) {
                    return {
                        itemId: item.itemId,
                        type: ProposalType.QUANTITY_REDUCTION,
                        proposedQuantity: item.newQuantity,
                    };
                }

                if (item.requestedWeightGrams !== undefined && item.newWeightGrams !== undefined && item.newWeightGrams !== item.requestedWeightGrams) {
                    return {
                        itemId: item.itemId,
                        type: ProposalType.WEIGHT_ADJUSTMENT,
                        proposedWeightGrams: item.newWeightGrams,
                        requestedWeightGrams: item.requestedWeightGrams,
                    };
                }

                return null;
            })
            .filter((x): x is ProposeChangesDto => x !== null);

        onSubmit(proposals);
        onClose();
    };

    const updateItem = (itemId: string, partial: Partial<DraftItem>) => {
        setDraftItems((previous) =>
            previous.map((it) => (it.itemId === itemId ? { ...it, ...partial } : it)),
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('orders.prepare_order')} #{order?.id?.slice(0, 8) ?? ''}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.body}>
                        {draftItems.length === 0 && <Text style={styles.emptyText}>{t('orders.no_items')}</Text>}
                        {draftItems.map((item) => {
                            const isQtyItem = item.originalQuantity !== undefined;
                            return (
                                <View key={item.itemId} style={styles.itemRow}>
                                    <View style={styles.itemRowHeader}>
                                        <Text style={styles.itemName}>{item.productName}</Text>
                                        <View style={styles.unavailableWrapper}>
                                            <Text style={styles.unavailableLabel}>{t('orders.unavailable')}</Text>
                                            <Switch
                                                value={item.isUnavailable}
                                                onValueChange={(value) => {
                                                    updateItem(item.itemId, { isUnavailable: value });
                                                }}
                                            />
                                        </View>
                                    </View>
                                    {isQtyItem ? (
                                        <View style={styles.inputRow}>
                                            <Text style={styles.label}>{t('orders.original_qty')}:</Text>
                                            <Text style={styles.value}>{item.originalQuantity}</Text>
                                            <Text style={[styles.label, { marginLeft: 16 }]}>{t('orders.new_qty')}:</Text>
                                            <TextInput
                                                style={[styles.input, item.isUnavailable && styles.inputDisabled]}
                                                keyboardType="numeric"
                                                editable={!item.isUnavailable}
                                                value={String(item.newQuantity ?? 0)}
                                                onChangeText={(text) => {
                                                    const parsed = Number(text.replace(/[^0-9]/g, ''));
                                                    updateItem(item.itemId, { newQuantity: Number.isNaN(parsed) ? 0 : parsed });
                                                }}
                                            />
                                        </View>
                                    ) : (
                                        <View style={styles.inputRow}>
                                            <Text style={styles.label}>{t('orders.requested_weight')}:</Text>
                                            <Text style={styles.value}>≈ {(item.requestedWeightGrams! / 1000).toFixed(2)} kg</Text>
                                            <View style={styles.weightInputWrapper}>
                                                <Text style={styles.label}>{t('orders.new_weight') || 'New Weight'}:</Text>
                                                <TextInput
                                                    style={[styles.input, { flex: 1 }, item.isUnavailable && styles.inputDisabled]}
                                                    keyboardType="numeric"
                                                    editable={!item.isUnavailable}
                                                    value={item.newWeightKgString}
                                                    onChangeText={(text) => {
                                                        updateItem(item.itemId, { newWeightKgString: text });
                                                        const parsed = Number(text);
                                                        if (!Number.isNaN(parsed)) {
                                                            updateItem(item.itemId, { newWeightGrams: Math.round(parsed * 1000) });
                                                        }
                                                    }}
                                                />
                                                <Text style={styles.unit}>kg</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                            <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={onSubmitPress}
                        >
                            <Text style={styles.primaryButtonText}>{t('orders.confirm_preparation')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
    container: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '80%', overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderColor: '#e5e7eb' },
    title: { fontSize: 16, fontWeight: '700' },
    close: { fontSize: 24 },
    body: { padding: 14 },
    emptyText: { textAlign: 'center', color: '#64748b', marginTop: 20 },
    itemRow: { marginBottom: 14, borderBottomWidth: 1, borderColor: '#e5e7eb', paddingBottom: 8 },
    itemRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    unavailableWrapper: { flexDirection: 'row', alignItems: 'center' },
    unavailableLabel: { marginRight: 8, color: '#334155', fontSize: 12 },
    inputRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    label: { color: '#334155', fontSize: 12 },
    value: { marginLeft: 4, fontSize: 12, fontWeight: '600' },
    input: {
        marginLeft: 6,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        width: 70,
        fontSize: 14,
    },
    inputDisabled: { backgroundColor: '#f8fafc', color: '#94a3b8' },
    weightInputWrapper: { flexDirection: 'row', alignItems: 'center', marginLeft: 16, flex: 1 },
    unit: { marginLeft: 4, fontSize: 12, color: '#64748b' },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderColor: '#e5e7eb' },
    secondaryButton: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f1f5f9', borderRadius: 8 },
    secondaryButtonText: { color: '#0f172a', fontWeight: '700' },
    primaryButton: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#1d4ed8', borderRadius: 8 },
    primaryButtonText: { color: '#fff', fontWeight: '700' },
});

export default OrderPreparationModal;

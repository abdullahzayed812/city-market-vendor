import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Check, X, MapPin } from 'lucide-react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

interface StoreMapPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (data: { address: string; latitude: number; longitude: number }) => void;
    googleApiKey: string;
    initialLocation?: { latitude: number; longitude: number };
}

const StoreMapPickerModal = ({ visible, onClose, onConfirm, googleApiKey, initialLocation }: StoreMapPickerModalProps) => {
    const [region, setRegion] = useState({
        latitude: initialLocation?.latitude || 24.7136,
        longitude: initialLocation?.longitude || 46.6753,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
    });
    const [address, setAddress] = useState('');
    const mapRef = useRef<MapView>(null);

    const handleLocationSelected = (data: any, details: any = null) => {
        if (details) {
            const { lat, lng } = details.geometry.location;
            const newRegion = {
                ...region,
                latitude: lat,
                longitude: lng,
            };
            setRegion(newRegion);
            setAddress(data.description);
            mapRef.current?.animateToRegion(newRegion, 1000);
        }
    };

    const handleRegionChange = (newRegion: any) => {
        setRegion(newRegion);
    };

    const handleConfirm = () => {
        onConfirm({
            address: address || 'Selected Store Location',
            latitude: region.latitude,
            longitude: region.longitude,
        });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={region}
                    onRegionChangeComplete={handleRegionChange}
                >
                    <Marker
                        coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                    />
                </MapView>

                <View style={styles.searchContainer}>
                    <GooglePlacesAutocomplete
                        placeholder="Search for your store address..."
                        fetchDetails={true}
                        onPress={handleLocationSelected}
                        query={{
                            key: googleApiKey,
                            language: 'en',
                        }}
                        styles={{
                            container: { flex: 0 },
                            textInput: styles.searchInput,
                            listView: styles.searchListView,
                        }}
                    />
                </View>

                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                        <X size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Set Store Location</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.footer}>
                    <View style={styles.addressDisplay}>
                        <MapPin size={20} color={theme.colors.primary} />
                        <Text style={styles.addressText} numberOfLines={2}>
                            {address || 'Move the map to set store location'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                        <Check size={24} color={theme.colors.white} />
                        <Text style={styles.confirmButtonText}>Confirm Store Location</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        height: 56,
        backgroundColor: theme.colors.white,
        borderRadius: theme.radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        ...theme.shadows.medium,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    iconButton: { padding: 10 },
    searchContainer: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        zIndex: 1,
    },
    searchInput: {
        backgroundColor: theme.colors.white,
        height: 50,
        borderRadius: theme.radius.md,
        paddingHorizontal: 15,
        fontSize: 16,
        ...theme.shadows.soft,
    },
    searchListView: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.radius.md,
        marginTop: 5,
        ...theme.shadows.medium,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: theme.colors.white,
        borderRadius: theme.radius.lg,
        padding: 20,
        ...theme.shadows.medium,
    },
    addressDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    addressText: {
        flex: 1,
        marginLeft: 10,
        color: theme.colors.primary,
        fontSize: 14,
    },
    confirmButton: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: theme.radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default StoreMapPickerModal;

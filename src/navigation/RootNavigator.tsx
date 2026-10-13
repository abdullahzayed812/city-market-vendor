import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export const navigationRef = createNavigationContainerRef();
import { useAuth } from '../app/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import StoreApplicationScreen from '../screens/StoreApplicationScreen';
import StoreStatusScreen from '../screens/StoreStatusScreen';
import MainTabNavigator from './MainTabNavigator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VendorApprovalStatus } from '@city-market/shared';
import QueryError from '../components/common/QueryError';
import { VendorService } from '../services/api/vendorService';
import { ActivityIndicator, View } from 'react-native';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';

const Stack = createNativeStackNavigator();
const TERMS_ACCEPTED_KEY = '@citymarket_vendor_terms_accepted';

// What a signed-in merchant sees, from their store (read live, not the cached profile):
//   no store yet (new signup)      -> store application
//   pending review / rejected      -> status screen (correct and resubmit from there)
//   suspended                      -> status screen
//   approved                       -> the app
// This only decides screens; the services enforce approval on every merchant operation.
const VendorGate = () => {
  const { updateVendor } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const { data: vendor, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['myVendor'],
    queryFn: () => VendorService.getProfile(),
    // 404 just means "no store yet"; don't retry it
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
  });

  // The rest of the app reads the store from AuthContext (cached across launches): keep it current
  const updateVendorRef = React.useRef(updateVendor);
  updateVendorRef.current = updateVendor;
  React.useEffect(() => {
    if (vendor) updateVendorRef.current(vendor).catch(() => {});
  }, [vendor]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const done = () => {
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ['myVendor'] });
  };

  const notFound = (error as any)?.response?.status === 404;
  if (notFound) return <StoreApplicationScreen onSubmitted={done} />;
  if (error || !vendor) return <QueryError error={error} onRetry={() => refetch()} />;

  const status = vendor.approvalStatus ?? VendorApprovalStatus.APPROVED;
  if (status === VendorApprovalStatus.APPROVED) return <MainTabNavigator />;
  if (editing && (status === VendorApprovalStatus.PENDING_REVIEW || status === VendorApprovalStatus.REJECTED)) {
    return <StoreApplicationScreen existing={vendor} onSubmitted={done} onCancel={() => setEditing(false)} />;
  }
  return <StoreStatusScreen vendor={vendor} refetch={() => refetch()} refreshing={isRefetching} onEdit={() => setEditing(true)} />;
};

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [termsAccepted, setTermsAccepted] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem(TERMS_ACCEPTED_KEY).then(value => {
      setTermsAccepted(value === 'true');
    });
  }, []);

  const handleAcceptTerms = async () => {
    await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
    setTermsAccepted(true);
  };

  if (isLoading || termsAccepted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!termsAccepted) {
    return <TermsAndConditionsScreen onAccept={handleAcceptTerms} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={VendorGate} />
        ) : (
          <>
            <Stack.Screen name="Auth" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;

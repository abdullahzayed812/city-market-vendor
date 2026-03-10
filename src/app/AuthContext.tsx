import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VendorService } from '../services/api/vendorService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  token: string | null;
  vendor: any | null;
  signIn: (user: any, accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateVendor: (vendor: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [vendor, setVendor] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('auth_token');
      const savedUser = await AsyncStorage.getItem('auth_user');
      const savedVendor = await AsyncStorage.getItem('auth_vendor');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        if (savedVendor) {
          setVendor(JSON.parse(savedVendor));
        } else {
          // If token exists but vendor profile doesn't, try to fetch it
          try {
            const profile = await VendorService.getProfile();
            if (profile) {
              await updateVendor(profile);
            }
          } catch (e) {
            console.error('Failed to fetch profile in checkAuth:', e);
          }
        }
        
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Initial auth check failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userData: any, accessToken: string, refreshToken: string) => {
    try {
      await AsyncStorage.setItem('auth_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);

      // Fetch vendor profile immediately after sign in
      try {
        const profile = await VendorService.getProfile();
        if (profile) {
          await updateVendor(profile);
        }
      } catch (e) {
        console.error('Failed to fetch profile after sign in:', e);
      }
    } catch (e) {
      console.error('SignIn failed:', e);
      throw e;
    }
  };

  const updateVendor = async (vendorData: any) => {
    await AsyncStorage.setItem('auth_vendor', JSON.stringify(vendorData));
    setVendor(vendorData);
  };

  const refreshProfile = async () => {
    try {
      const profile = await VendorService.getProfile();
      if (profile) {
        await updateVendor(profile);
      }
    } catch (e) {
      console.error('Refresh profile failed:', e);
      throw e;
    }
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove([
      'auth_token',
      'refresh_token',
      'auth_user',
      'auth_vendor',
    ]);
    setToken(null);
    setUser(null);
    setVendor(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        vendor,
        signIn,
        signOut,
        updateVendor,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

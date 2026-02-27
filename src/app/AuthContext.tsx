import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/api/authService';
import { VendorService } from '../services/api/vendorService';
import { UserRole } from '@city-market/shared';
import { useTranslation } from 'react-i18next';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  vendor: any | null;
  token: string | null;
  signIn: (credentials: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation();
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

      if (savedToken && savedUser) {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
        setIsAuthenticated(true);

        // Fetch vendor profile to ensure we have it
        try {
          const profile = await VendorService.getProfile();
          setVendor(profile);
        } catch (error) {
          console.error('Failed to fetch vendor profile on init:', error);
        }
      }
    } catch (e) {
      console.error('Initial auth check failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (credentials: any) => {
    const data = await AuthService.login(credentials);

    if (data.user?.role !== UserRole.VENDOR) {
      throw new Error(t('auth.unauthorized_vendor'));
    }

    await AsyncStorage.setItem('auth_token', data.accessToken);
    await AsyncStorage.setItem('refresh_token', data.refreshToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));

    setToken(data.accessToken);
    setUser(data.user);
    setIsAuthenticated(true);

    try {
      const profile = await VendorService.getProfile();
      setVendor(profile);
    } catch (error) {
      console.error('Failed to fetch vendor profile after login:', error);
    }
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove([
      'auth_token',
      'refresh_token',
      'auth_user',
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
        vendor,
        token,
        signIn,
        signOut,
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

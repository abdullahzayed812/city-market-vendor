import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getSocketURL as fetchSocketURL } from '../utils/serverConfig';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let newSocket: Socket | null = null;

    const initSocket = async () => {
      if (!isAuthenticated) {
        if (socket) {
          socket.disconnect();
          setSocket(null);
          setIsConnected(false);
        }
        return;
      }

      const token = await AsyncStorage.getItem('auth_token');
      const SOCKET_URL = await fetchSocketURL();
      
      newSocket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket Gateway (Vendor Mobile)');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      setSocket(newSocket);
    };

    initSocket();

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

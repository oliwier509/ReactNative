import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleChange = () => setIsConnected(navigator.onLine);

      window.addEventListener('online', handleChange);
      window.addEventListener('offline', handleChange);

      setIsConnected(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleChange);
        window.removeEventListener('offline', handleChange);
      };
    } else {
      const unsubscribe = NetInfo.addEventListener((state) => {
        setIsConnected(state.isConnected && state.isInternetReachable);
      });

      NetInfo.fetch().then(state => setIsConnected(state.isConnected && state.isInternetReachable));

      return () => unsubscribe();
    }
  }, []);

  return isConnected;
}

import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  isLoading: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: false,
    isInternetReachable: false,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!cancelled) {
          setStatus({
            isConnected: state.isConnected ?? false,
            isInternetReachable: state.isInternetReachable ?? false,
            isLoading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setStatus({ isConnected: false, isInternetReachable: false, isLoading: false });
        }
      }
    }

    check();
    const interval = setInterval(check, 15_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}

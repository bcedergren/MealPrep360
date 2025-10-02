import { useCallback, useEffect, useState } from 'react';
import { isApiError, isNetworkError, useApiClient } from '../services/api';

export interface ApiHealthStatus {
  isOnline: boolean;
  isHealthy: boolean;
  lastChecked: Date | null;
  error: string | null;
  responseTime: number | null;
}

export const useApiHealth = (autoCheck = true) => {
  const api = useApiClient();
  const [status, setStatus] = useState<ApiHealthStatus>({
    isOnline: false,
    isHealthy: false,
    lastChecked: null,
    error: null,
    responseTime: null,
  });

  const checkHealth = useCallback(async (): Promise<ApiHealthStatus> => {
    const startTime = Date.now();
    
    try {
      await api.healthCheck();
      const responseTime = Date.now() - startTime;
      
      const newStatus: ApiHealthStatus = {
        isOnline: true,
        isHealthy: true,
        lastChecked: new Date(),
        error: null,
        responseTime,
      };
      
      setStatus(newStatus);
      return newStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      let errorMessage = 'Unknown error';
      let isOnline = false;
      
      if (isApiError(error)) {
        errorMessage = error.message;
        isOnline = !isNetworkError(error);
      }
      
      const newStatus: ApiHealthStatus = {
        isOnline,
        isHealthy: false,
        lastChecked: new Date(),
        error: errorMessage,
        responseTime,
      };
      
      setStatus(newStatus);
      return newStatus;
    }
  }, [api]);

  // Auto check on mount if enabled
  useEffect(() => {
    if (autoCheck) {
      checkHealth();
    }
  }, [autoCheck, checkHealth]);

  return {
    status,
    checkHealth,
    refresh: checkHealth,
  };
};

export default useApiHealth;
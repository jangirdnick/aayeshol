'use client';

import * as React from 'react';
import type { AxiosInstance } from 'axios';
import { apiClient } from './axios-client';

const AxiosContext = React.createContext<AxiosInstance | null>(null);

export interface AxiosProviderProps {
  children: React.ReactNode;
  client?: AxiosInstance;
}

/**
 * React Context Provider for Axios.
 * Exposes the configured Axios client instance to child components and hooks.
 */
export function AxiosProvider({ children, client = apiClient }: AxiosProviderProps) {
  return <AxiosContext.Provider value={client}>{children}</AxiosContext.Provider>;
}

/**
 * Hook to access the configured Axios client instance from any client component.
 */
export function useApiClient(): AxiosInstance {
  const context = React.useContext(AxiosContext);
  if (!context) {
    // Graceful fallback to singleton instance
    return apiClient;
  }
  return context;
}

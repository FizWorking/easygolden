import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getAuthStatus, login, logout } from '../api/client';
import type { CompanyInfo } from '../types';

interface AuthContextType {
  connected: boolean;
  company: CompanyInfo | null;
  loading: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  connected: false,
  company: null,
  loading: true,
  connect: () => {},
  disconnect: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthStatus()
      .then((status) => {
        setConnected(status.connected);
        setCompany(status.company);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const connect = async () => {
    await login();
  };

  const disconnect = async () => {
    await logout();
    setConnected(false);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ connected, company, loading, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

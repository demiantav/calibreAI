import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface AuthUser {
  id: string;
  email: string;
  youtube_channel_id: string | null;
  youtube_channel_name: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  auto_pitch_enabled: boolean;
  email_digest_enabled: boolean;
  timezone: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = () => localStorage.getItem('calibre-jwt');

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('calibre-jwt');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('calibre-jwt');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('calibre-jwt', data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('calibre-jwt', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('calibre-jwt');
    setUser(null);
  };

  const refreshUser = async () => {
    setIsLoading(true);
    await fetchUser();
  };

  const updateUser = async (updates: Partial<AuthUser>) => {
    const token = getToken();
    if (!token || !user) return;

    // Optimistic update
    setUser((prev) => (prev ? { ...prev, ...updates } : null));

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        // Rollback: re-fetch from server to restore correct state
        await fetchUser();
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }
    } catch {
      // On network error, also re-fetch to sync state
      await fetchUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

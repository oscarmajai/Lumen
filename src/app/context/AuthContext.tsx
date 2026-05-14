import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loginUser, registerCompany, refreshAccessToken, changePassword as changePasswordApi, RegisterResult } from '@/lib/api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'EMPLOYEE';
  companyId: string;
  areaIds: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (email: string, password: string, companySlug: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<RegisterResult>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export interface RegisterPayload {
  company_name: string;
  admin_name: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwt(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

function isExpired(token: string): boolean {
  const { exp } = decodeJwt(token) as { exp?: number };
  if (!exp) return true;
  return Date.now() / 1000 > exp - 30; // 30 s margin
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('must_change_password');
    setUser(null);
    setMustChangePassword(false);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const access = localStorage.getItem('access_token');
      const refresh = localStorage.getItem('refresh_token');

      if (!access && !refresh) { setIsLoading(false); return; }

      // If access token is still valid, decode user from it
      if (access && !isExpired(access)) {
        const cached = localStorage.getItem('auth_user');
        if (cached) setUser(JSON.parse(cached));
        const mustChange = localStorage.getItem('must_change_password') === 'true';
        if (mustChange) setMustChangePassword(true);
        setIsLoading(false);
        return;
      }

      // Access expired — try refresh
      if (refresh && !isExpired(refresh)) {
        try {
          const res = await refreshAccessToken(refresh);
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('refresh_token', res.refresh_token);
          const cached = localStorage.getItem('auth_user');
          if (cached) setUser(JSON.parse(cached));
          const mustChange = localStorage.getItem('must_change_password') === 'true';
          if (mustChange) setMustChangePassword(true);
        } catch {
          logout();
        }
      } else {
        logout();
      }
      setIsLoading(false);
    };

    restore();
  }, [logout]);

  const login = useCallback(async (email: string, password: string, companySlug: string) => {
    const res = await loginUser({ email, password, company_slug: companySlug });

    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('refresh_token', res.refresh_token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    localStorage.setItem('must_change_password', String(res.must_change_password));

    setUser(res.user);
    setMustChangePassword(res.must_change_password);
  }, []);

  const register = useCallback(async (data: RegisterPayload): Promise<RegisterResult> => {
    return registerCompany(data);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await changePasswordApi({ current_password: currentPassword, new_password: newPassword });
    setMustChangePassword(false);
    localStorage.removeItem('must_change_password');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      mustChangePassword,
      login,
      register,
      logout,
      changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

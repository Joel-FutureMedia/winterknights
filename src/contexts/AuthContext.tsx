import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

interface AuthUser {
  email: string;
  role: string;
  companyId: string | null;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, email: string, role: string, companyId: string | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCompany: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('wk_user');
    if (!stored) return null;
    try {
      const u = JSON.parse(stored) as AuthUser;
      const decoded: any = jwtDecode(u.token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('wk_token');
        localStorage.removeItem('wk_user');
        return null;
      }
      return u;
    } catch {
      return null;
    }
  });

  const login = useCallback((token: string, email: string, role: string, companyId: string | null) => {
    const u: AuthUser = { token, email, role, companyId };
    localStorage.setItem('wk_token', token);
    localStorage.setItem('wk_user', JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wk_token');
    localStorage.removeItem('wk_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';
  const isCompany = user?.role === 'ROLE_COMPANY';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isSuperAdmin, isCompany }}>
      {children}
    </AuthContext.Provider>
  );
};

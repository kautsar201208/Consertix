import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/utils/storage';
import { API_URL } from '@/config/api';

export interface User {
  id: number;
  nama: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nama: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@concertix_auth_token';
const USER_KEY = '@concertix_auth_user';

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Periksa sesi saat aplikasi pertama kali dibuka
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          storage.getItem(TOKEN_KEY),
          storage.getItem(USER_KEY),
        ]);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error('Gagal memulihkan sesi login:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const res = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal. Silakan periksa kembali email dan password.');
      }

      const receivedToken = data.token;
      const receivedUser: User = data.user;

      await Promise.all([
        storage.setItem(TOKEN_KEY, receivedToken),
        storage.setItem(USER_KEY, JSON.stringify(receivedUser)),
      ]);

      setToken(receivedToken);
      setUser(receivedUser);
      setIsLoggedIn(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Koneksi timeout. Pastikan server backend sedang aktif.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (nama: string, email: string, password: string) => {
    try {
      setLoading(true);

      const res = await fetchWithTimeout(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: nama.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registrasi gagal. Silakan coba kembali.');
      }

      const receivedToken = data.token;
      const receivedUser: User = data.user;

      await Promise.all([
        storage.setItem(TOKEN_KEY, receivedToken),
        storage.setItem(USER_KEY, JSON.stringify(receivedUser)),
      ]);

      setToken(receivedToken);
      setUser(receivedUser);
      setIsLoggedIn(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Koneksi timeout. Pastikan server backend sedang aktif.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        storage.removeItem(TOKEN_KEY),
        storage.removeItem(USER_KEY),
      ]);
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


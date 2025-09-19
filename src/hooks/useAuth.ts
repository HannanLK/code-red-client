"use client";
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout, setToken, setUser, setStatus } from '@/features/auth/authSlice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, status, error } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (stored && !token) dispatch(setToken(stored));
  }, [dispatch, token]);

  const saveToken = useCallback((t: string | null) => {
    if (typeof window !== 'undefined') {
      if (t) localStorage.setItem('token', t);
      else localStorage.removeItem('token');
    }
    dispatch(setToken(t));
  }, [dispatch]);

  const signOut = useCallback(() => {
    saveToken(null);
    dispatch(logout());
  }, [dispatch, saveToken]);

  const setAuthUser = useCallback((u: { id: string; name: string } | null) => {
    dispatch(setUser(u));
  }, [dispatch]);

  const setAuthStatus = useCallback((s: 'idle' | 'loading' | 'authenticated' | 'error') => {
    dispatch(setStatus(s));
  }, [dispatch]);

  return { user, token, status, error, saveToken, signOut, setAuthUser, setAuthStatus } as const;
}

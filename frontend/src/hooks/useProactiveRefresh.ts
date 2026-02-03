/**
 * 로그인 유지: 액세스 토큰 만료 전에 자동 갱신
 * 24시간 유효 시 23시간마다, keepLoggedIn일 때만 동작
 */
import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore, getRefreshToken } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const REFRESH_INTERVAL_MS = 23 * 60 * 60 * 1000; // 23시간 (액세스 24h 대비 여유)

export function useProactiveRefresh() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const isKeepLoggedIn = !!localStorage.getItem('refreshToken');

    if (!isKeepLoggedIn) return;

    const doRefresh = async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return;
      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const payload = res.data?.data ?? res.data;
        if (payload?.accessToken && payload?.user) {
          login(
            {
              accessToken: payload.accessToken,
              refreshToken: payload.refreshToken ?? refreshToken,
              expiresIn: payload.expiresIn ?? 86400,
              user: payload.user,
            },
            { keepLoggedIn: true }
          );
        }
      } catch {
        logout();
      }
    };

    intervalRef.current = setInterval(doRefresh, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, login, logout]);
}

/**
 * Axios 인스턴스 설정
 * 스프링 부트 백엔드 API 통신용
 */

import axios from 'axios';
import { getAccessToken, getRefreshToken, useAuthStore } from '@/store/authStore';

// 개발 시 미설정이면 상대 경로 /api 사용 → Vite 프록시(localhost:8080)로 전달됨. 백엔드 동시 실행 필요.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : 'http://localhost:8080/api');

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: JWT 토큰 자동 추가 (localStorage 또는 sessionStorage)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 에러 처리 및 토큰 갱신
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized: 토큰 만료 (단, 로그인/가입/구글로그인/리프레시 요청은 제외해서 무한루프 및 에러 왜곡 방지)
    const isAuthRequest = originalRequest.url.includes('/auth/login') || 
                          originalRequest.url.includes('/auth/google') || 
                          originalRequest.url.includes('/auth/signup') ||
                          originalRequest.url.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          // 토큰 갱신 요청
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const payload = response.data?.data ?? response.data;
          const accessToken = payload.accessToken;
          const newRefreshToken = payload.refreshToken;
          const storage = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
          if (accessToken) storage.setItem('accessToken', accessToken);
          if (newRefreshToken) storage.setItem('refreshToken', newRefreshToken);

          if (accessToken && payload.user) {
            useAuthStore.getState().login(
              {
                accessToken,
                refreshToken: newRefreshToken ?? refreshToken,
                expiresIn: payload.expiresIn ?? 86400,
                user: payload.user,
              },
              { keepLoggedIn: !!localStorage.getItem('refreshToken') }
            );
          }

          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // 리프레시 실패 시 로그아웃
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        // 리프레시 토큰 없으면 로그아웃
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

/**
 * Axios 인스턴스 설정
 * 스프링 부트 백엔드 API 통신용
 */

import axios from 'axios';
import { getAccessToken, getRefreshToken, useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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

    // 401 Unauthorized: 토큰 만료
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          // 리프레시 토큰 없으면 로그아웃 처리
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

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
              refreshToken: newRefreshToken ?? getRefreshToken() ?? '',
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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

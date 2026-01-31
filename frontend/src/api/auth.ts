/**
 * 인증 API
 */

import axiosInstance from '@/lib/axios';
import type { ApiResponse } from '@/types/dto';
import type {
  LoginRequest,
  SignupRequest,
  ShelterSignupResponse,
  TokenResponse,
  UserResponse,
  UpdateMeRequest,
} from '@/types/dto';

export const authApi = {
  signup: (data: SignupRequest) =>
    axiosInstance.post<ApiResponse<UserResponse>>('/auth/signup', data),

  /** 보호소 회원가입 (multipart: 폼 필드 + 사업자등록증 파일). Content-Type 제거 시 브라우저가 boundary 포함 multipart로 설정 */
  shelterSignup: (formData: FormData) =>
    axiosInstance.post<ApiResponse<ShelterSignupResponse>>('/auth/shelter-signup', formData, {
      headers: { 'Content-Type': false as unknown as string },
    }),

  login: (data: LoginRequest) =>
    axiosInstance.post<ApiResponse<TokenResponse>>('/auth/login', data),

  logout: () =>
    axiosInstance.post<ApiResponse<null>>('/auth/logout'),

  getMe: () =>
    axiosInstance.get<ApiResponse<UserResponse>>('/auth/me'),

  updateMe: (data: UpdateMeRequest) =>
    axiosInstance.patch<ApiResponse<UserResponse>>('/auth/me', data),

  refresh: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<TokenResponse>>('/auth/refresh', { refreshToken }),
};

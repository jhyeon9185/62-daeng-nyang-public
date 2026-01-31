/**
 * Preference API 모듈
 * 사용자 입양 선호도 조회/설정
 */

import axiosInstance from '@/lib/axios';
import type {
  PreferenceRequest,
  PreferenceResponse,
  ApiResponse,
} from '@/types/dto';

export const preferenceApi = {
  /**
   * 내 선호도 조회
   */
  getMy: async () => {
    const response = await axiosInstance.get<ApiResponse<PreferenceResponse | null>>(
      '/users/me/preferences'
    );
    return response.data?.data ?? null;
  },

  /**
   * 선호도 설정/수정
   */
  update: async (data: PreferenceRequest) => {
    const response = await axiosInstance.put<ApiResponse<PreferenceResponse>>(
      '/users/me/preferences',
      data
    );
    return response.data?.data ?? null;
  },

  /**
   * 선호도 기반 추천 동물 목록
   */
  getRecommendedAnimals: async (page = 0, size = 12) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      '/animals/recommendations',
      { params: { page, size } }
    );
    return response.data.data;
  },
};

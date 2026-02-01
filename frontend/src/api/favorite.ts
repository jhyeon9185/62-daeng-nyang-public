/**
 * Favorite API 모듈
 * 동물 찜(즐겨찾기) 추가/해제, 내 찜 목록
 */

import axiosInstance from '@/lib/axios';
import type { ApiResponse, PageResponse } from '@/types/dto';
import type { Animal } from '@/types/entities';

export const favoriteApi = {
  /** 찜 추가 */
  add: async (animalId: number) => {
    const response = await axiosInstance.post<ApiResponse<null>>(`/favorites/${animalId}`);
    return response.data.data;
  },

  /** 찜 해제 */
  remove: async (animalId: number) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/favorites/${animalId}`);
    return response.data.data;
  },

  /** 내 찜 목록 */
  getMyList: async (page = 0, size = 20) => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<Animal>>>('/favorites', {
      params: { page, size },
    });
    return response.data.data;
  },

  /** 내 찜한 동물 ID 목록 (카드 하트 표시용) */
  getMyFavoriteIds: async () => {
    const response = await axiosInstance.get<ApiResponse<number[]>>('/favorites/ids');
    return response.data.data ?? [];
  },
};

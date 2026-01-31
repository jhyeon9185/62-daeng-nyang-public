/**
 * Adoption API 모듈
 * 입양/임시보호 신청, 내 신청 목록 조회, 취소
 */

import axiosInstance from '@/lib/axios';
import type {
  AdoptionRequest,
  AdoptionResponse,
  AdoptionListResponse,
  ApiResponse,
} from '@/types/dto';

export const adoptionApi = {
  /**
   * 입양/임시보호 신청
   */
  apply: async (data: AdoptionRequest) => {
    const response = await axiosInstance.post<ApiResponse<AdoptionResponse>>(
      '/adoptions',
      data
    );
    return response.data.data;
  },

  /**
   * 내 신청 목록 조회
   */
  getMyList: async (page = 0, size = 10) => {
    const response = await axiosInstance.get<ApiResponse<AdoptionListResponse>>(
      '/adoptions/my',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /**
   * 신청 취소
   */
  cancel: async (id: number) => {
    const response = await axiosInstance.patch<ApiResponse<AdoptionResponse>>(
      `/adoptions/${id}/cancel`
    );
    return response.data.data;
  },

  /**
   * 특정 동물의 신청 현황 조회 (관리자용)
   */
  getByAnimalId: async (animalId: number) => {
    const response = await axiosInstance.get<ApiResponse<AdoptionListResponse>>(
      `/adoptions/animal/${animalId}`
    );
    return response.data.data;
  },

  /** 보호소 대기 신청 목록 (보호소 관리자) */
  getPendingByShelter: async (page = 0, size = 20) => {
    const response = await axiosInstance.get<ApiResponse<AdoptionListResponse>>(
      '/adoptions/shelter/pending',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /** 승인 (관리자) */
  approve: async (id: number) => {
    const response = await axiosInstance.put<ApiResponse<AdoptionResponse>>(
      `/adoptions/${id}/approve`
    );
    return response.data.data;
  },

  /** 반려 (관리자) */
  reject: async (id: number, rejectReason?: string) => {
    const response = await axiosInstance.put<ApiResponse<AdoptionResponse>>(
      `/adoptions/${id}/reject`,
      { rejectReason: rejectReason ?? null }
    );
    return response.data.data;
  },
};

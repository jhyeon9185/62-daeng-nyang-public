/**
 * Donation API 모듈
 * 물품 기부 요청 조회, 기부 신청, 내 기부 목록 조회
 */

import axiosInstance from '@/lib/axios';
import type {
  DonationApplyRequest,
  DonationRequestCreateRequest,
  DonationRequestListResponse,
  DonationRequestResponse,
  DonationResponse,
  DonationListResponse,
  ApiResponse,
} from '@/types/dto';

export const donationApi = {
  /**
   * 물품 기부 요청 목록 조회
   */
  getAllRequests: async (page = 0, size = 10) => {
    const response = await axiosInstance.get<ApiResponse<DonationRequestListResponse>>(
      '/donations/requests',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /**
   * 물품 기부 요청 상세 조회
   */
  getRequestById: async (id: number) => {
    const response = await axiosInstance.get<ApiResponse<DonationRequestResponse>>(
      `/donations/requests/${id}`
    );
    return response.data.data;
  },

  /**
   * 물품 기부 요청 등록 (보호소)
   */
  createRequest: async (data: DonationRequestCreateRequest) => {
    const response = await axiosInstance.post<ApiResponse<DonationRequestResponse>>(
      '/donations/requests',
      data
    );
    return response.data.data;
  },

  /**
   * 물품 기부 신청
   */
  donate: async (data: DonationApplyRequest) => {
    const response = await axiosInstance.post<ApiResponse<DonationResponse>>(
      '/donations',
      data
    );
    return response.data.data;
  },

  /**
   * 내 기부 목록 조회
   */
  getMyList: async (page = 0, size = 10) => {
    const response = await axiosInstance.get<ApiResponse<DonationListResponse>>(
      '/donations/my',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /** 보호소 대기 신청 목록 (보호소 관리자) */
  getPendingByShelter: async (page = 0, size = 20) => {
    const response = await axiosInstance.get<ApiResponse<DonationListResponse>>(
      '/donations/shelter/pending',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /** 수령 완료 (관리자) */
  complete: async (id: number) => {
    const response = await axiosInstance.put<ApiResponse<DonationResponse>>(
      `/donations/${id}/complete`
    );
    return response.data.data;
  },

  /** 반려 (관리자) */
  reject: async (id: number, rejectReason?: string) => {
    const response = await axiosInstance.put<ApiResponse<DonationResponse>>(
      `/donations/${id}/reject`,
      { rejectReason: rejectReason ?? null }
    );
    return response.data.data;
  },
};

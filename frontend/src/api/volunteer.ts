/**
 * Volunteer API 모듈
 * 봉사 모집공고 조회, 봉사 신청, 내 신청 목록 조회
 */

import axiosInstance from '@/lib/axios';
import type {
  VolunteerApplyRequest,
  VolunteerRecruitmentCreateRequest,
  VolunteerRecruitmentListResponse,
  VolunteerRecruitmentResponse,
  VolunteerResponse,
  VolunteerListResponse,
  ApiResponse,
} from '@/types/dto';

export const volunteerApi = {
  /**
   * 봉사 모집공고 목록 조회
   */
  getAllRecruitments: async (page = 0, size = 10) => {
    const response = await axiosInstance.get<ApiResponse<VolunteerRecruitmentListResponse>>(
      '/volunteers/recruitments',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /**
   * 봉사 모집공고 상세 조회
   */
  getRecruitmentById: async (id: number) => {
    const response = await axiosInstance.get<ApiResponse<VolunteerRecruitmentResponse>>(
      `/volunteers/recruitments/${id}`
    );
    return response.data.data;
  },

  /**
   * 봉사 모집공고 등록 (보호소)
   */
  createRecruitment: async (data: VolunteerRecruitmentCreateRequest) => {
    const response = await axiosInstance.post<ApiResponse<VolunteerRecruitmentResponse>>(
      '/volunteers/recruitments',
      data
    );
    return response.data.data;
  },

  /**
   * 봉사 신청
   */
  apply: async (data: VolunteerApplyRequest) => {
    const response = await axiosInstance.post<ApiResponse<VolunteerResponse>>(
      '/volunteers',
      data
    );
    return response.data.data;
  },

  /**
   * 내 봉사 신청 목록 조회
   */
  getMyList: async (page = 0, size = 10) => {
    const response = await axiosInstance.get<ApiResponse<VolunteerListResponse>>(
      '/volunteers/my',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /** 보호소 대기 신청 목록 (보호소 관리자) */
  getPendingByShelter: async (page = 0, size = 20) => {
    const response = await axiosInstance.get<ApiResponse<VolunteerListResponse>>(
      '/volunteers/shelter/pending',
      { params: { page, size } }
    );
    return response.data.data;
  },

  /** 승인 (관리자) */
  approve: async (id: number) => {
    const response = await axiosInstance.put<ApiResponse<VolunteerResponse>>(
      `/volunteers/${id}/approve`
    );
    return response.data.data;
  },

  /** 반려 (관리자) */
  reject: async (id: number, rejectReason?: string) => {
    const response = await axiosInstance.put<ApiResponse<VolunteerResponse>>(
      `/volunteers/${id}/reject`,
      { rejectReason: rejectReason ?? null }
    );
    return response.data.data;
  },
};

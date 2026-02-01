/**
 * 관리자 API (SUPER_ADMIN / SHELTER_ADMIN)
 * 보호소 인증 승인·거절, 내 보호소 조회, 회원 목록, 게시판 관리, 사업자등록증 파일
 */

import axiosInstance from '@/lib/axios';
import type { ApiResponse } from '@/types/dto';
import type { ShelterResponse, ShelterVerifyRequest } from '@/types/dto';
import type { VerificationStatus } from '@/types/dto';
import type { UserResponse } from '@/types/dto';
import type { BoardResponse } from '@/types/dto';
import type { PageResponse } from '@/types/dto';
import type { Adoption, Volunteer, Donation } from '@/types/entities';

export type RoleFilter = 'USER' | 'SHELTER_ADMIN' | 'SUPER_ADMIN';

export const adminApi = {
  /** 내 보호소 조회 (보호소 관리자 로그인 시) */
  getMyShelter: () =>
    axiosInstance.get<ApiResponse<ShelterResponse>>('/admin/shelters/my'),

  /** 보호소 목록 조회 (상태별: PENDING, APPROVED, REJECTED) */
  getShelters: (status: VerificationStatus = 'PENDING') =>
    axiosInstance.get<ApiResponse<ShelterResponse[]>>('/admin/shelters', {
      params: { status },
    }),

  /** 보호소 인증 승인/거절 */
  verifyShelter: (shelterId: number, body: ShelterVerifyRequest) =>
    axiosInstance.put<ApiResponse<ShelterResponse>>(`/admin/shelters/${shelterId}/verify`, body),

  /** 사업자등록증 파일 조회 (blob, 새 탭에서 보기용) */
  getBusinessRegistrationFile: (shelterId: number) =>
    axiosInstance.get(`/admin/shelters/${shelterId}/business-registration-file`, {
      responseType: 'blob',
    }),

  /** 회원 목록 (페이지, 역할 필터) - role 빈 문자열이면 서버에 보내지 않음 */
  getUsers: (page = 0, size = 20, role?: RoleFilter) =>
    axiosInstance.get<ApiResponse<PageResponse<UserResponse>>>('/admin/users', {
      params: { page, size, ...(role ? { role } : {}) },
    }),

  /** 게시판 목록 (관리자) - type 빈 문자열이면 서버에 보내지 않음 */
  getBoards: (page = 0, size = 20, type?: string) =>
    axiosInstance.get<ApiResponse<PageResponse<BoardResponse>>>('/admin/boards', {
      params: { page, size, ...(type ? { type } : {}) },
    }),

  /** 게시글 상단 고정/해제 */
  setBoardPinned: (boardId: number, pinned: boolean) =>
    axiosInstance.put<ApiResponse<BoardResponse>>(`/admin/boards/${boardId}/pin`, { pinned }),

  /** 게시글 삭제 (관리자) */
  deleteBoard: (boardId: number) =>
    axiosInstance.delete<ApiResponse<null>>(`/admin/boards/${boardId}`),

  /** 공공데이터 유기동물 동기화 (장시간 소요 → 타임아웃 3분) */
  syncFromPublicApi: (params?: { days?: number; maxPages?: number; species?: string }) =>
    axiosInstance.post<
      ApiResponse<{
        addedCount: number;
        updatedCount: number;
        syncedCount: number;
        statusCorrectedCount: number;
        days: number;
        species: string;
        apiKeyConfigured?: boolean;
      }>
    >('/admin/animals/sync-from-public-api', null, { params, timeout: 180_000 }),

  /** 동기화 이력 목록 (자동/수동, 추가·수정·삭제·보정) */
  getSyncHistory: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<PageResponse<SyncHistoryItem>>>('/admin/animals/sync-history', {
      params: { page, size },
    }),

  /** [시스템 관리자] 전체 입양/임보 신청 내역 */
  getAllAdoptions: (page = 0, size = 50) =>
    axiosInstance.get<ApiResponse<PageResponse<Adoption>>>('/admin/applications/adoptions', {
      params: { page, size },
    }),

  /** [시스템 관리자] 전체 봉사 신청 내역 */
  getAllVolunteers: (page = 0, size = 50) =>
    axiosInstance.get<ApiResponse<PageResponse<Volunteer>>>('/admin/applications/volunteers', {
      params: { page, size },
    }),

  /** [시스템 관리자] 전체 기부 신청 내역 */
  getAllDonations: (page = 0, size = 50) =>
    axiosInstance.get<ApiResponse<PageResponse<Donation>>>('/admin/applications/donations', {
      params: { page, size },
    }),

  /** 테스트 이메일 발송 (관리자). to 미입력 시 로그인한 관리자 이메일로 발송 */
  sendTestEmail: (to?: string) =>
    axiosInstance.post<ApiResponse<string>>('/admin/email/test', to != null && to.trim() !== '' ? { to: to.trim() } : {}),
};

export interface SyncHistoryItem {
  id: number;
  runAt: string;
  triggerType: 'AUTO' | 'MANUAL';
  addedCount: number;
  updatedCount: number;
  deletedCount: number;
  correctedCount: number;
  errorMessage: string | null;
  daysParam: number | null;
  speciesFilter: string | null;
}

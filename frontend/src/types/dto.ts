/**
 * Backend Request/Response DTO 타입
 * 스프링 부트 Controller와 통신할 때 사용
 */

import type {
  Animal,
  Adoption,
  Volunteer,
  VolunteerRecruitment,
  Donation,
  DonationRequest,
  Board,
  Comment,
  Preference,
  Species,
  Gender,
  Size,
  AnimalStatus,
} from './entities';

// ========== Common ==========
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ErrorResponse {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

// ========== Auth DTOs ==========
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ShelterSignupRequest {
  email: string;
  password: string;
  managerName: string;
  managerPhone: string;
  shelterName: string;
  address: string;
  shelterPhone: string;
  businessRegistrationNumber?: string;
}

export interface ShelterSignupResponse {
  userId: number;
  shelterId: number;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface UpdateMeRequest {
  name?: string;
  email?: string;
}

// ========== Animal DTOs ==========
export interface AnimalListRequest {
  species?: 'DOG' | 'CAT';
  /** 동물 크기 필터 (API param: animalSize, size와 충돌 방지) */
  animalSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
  age?: number;
  status?: 'PROTECTED' | 'ADOPTED' | 'FOSTERING';
  /** 보호소 주소 기준 지역 필터 (시·도 키워드, 예: 서울, 경기) */
  region?: string;
  /** 시·군·구 키워드 (시/도 선택 시 세부 조회, 예: 강남구, 수원시) */
  sigungu?: string;
  /** 이름·품종·보호소명 검색 (서버 검색) */
  search?: string;
  /** 정렬: random(기본, 많은 아이들이 골고루 노출), createdAt,desc 등 */
  sort?: string;
  page?: number;
  pageSize?: number;
  /** 백엔드 동물 목록 API 페이지 크기 파라미터명 */
  sizeParam?: number;
}

export interface AnimalCreateRequest {
  shelterId: number;
  species: Species;
  breed?: string;
  name?: string;
  age?: number;
  gender?: Gender;
  size?: Size;
  description?: string;
  imageUrl?: string;
  neutered?: boolean;
  vaccinated?: boolean;
  status?: AnimalStatus;
}

export type AnimalResponse = Animal;
export type AnimalListResponse = PageResponse<Animal>;

// ========== Adoption DTOs ==========
export interface AdoptionRequest {
  animalId: number;
  type: 'ADOPTION' | 'FOSTERING';
  reason: string;
  experience: string;
  livingEnv: string;
  familyAgreement: boolean;
}

export type AdoptionResponse = Adoption;
export type AdoptionListResponse = PageResponse<Adoption>;

// ========== Volunteer DTOs ==========
export interface VolunteerRecruitmentCreateRequest {
  shelterId: number;
  title: string;
  content: string;
  maxApplicants: number;
  deadline: string; // YYYY-MM-DD
}

export interface VolunteerApplyRequest {
  recruitmentId: number;
  applicantName: string;
  activityRegion: string;
  activityField: string;
  startDate: string; // ISO date string
  endDate: string;
  /** 신청 인원 (몇 명이 함께 봉사할지, 기본 1) */
  participantCount?: number;
  /** 신청 내용 (하고 싶은 말, 메모) */
  message?: string;
}

export type VolunteerRecruitmentResponse = VolunteerRecruitment;
export type VolunteerRecruitmentListResponse = PageResponse<VolunteerRecruitment>;
export type VolunteerResponse = Volunteer;
export type VolunteerListResponse = PageResponse<Volunteer>;

// ========== Donation DTOs ==========
export interface DonationRequestCreateRequest {
  shelterId: number;
  title: string;
  content: string;
  itemCategory: string;
  targetQuantity: number;
  deadline: string; // YYYY-MM-DD
}

export interface DonationApplyRequest {
  requestId: number;
  itemName: string;
  quantity: number;
  deliveryMethod: string;
  trackingNumber?: string;
}

export type DonationRequestResponse = DonationRequest;
export type DonationRequestListResponse = PageResponse<DonationRequest>;
export type DonationResponse = Donation;
export type DonationListResponse = PageResponse<Donation>;

// ========== Board DTOs ==========
export interface BoardCreateRequest {
  type: 'NOTICE' | 'FAQ' | 'FREE' | 'VOLUNTEER' | 'DONATION';
  title: string;
  content: string;
  shelterId?: number;
}

export interface BoardListRequest {
  type?: 'NOTICE' | 'FAQ' | 'FREE' | 'VOLUNTEER' | 'DONATION';
  page?: number;
  size?: number;
}

export interface CommentCreateRequest {
  content: string;
}

export type BoardResponse = Board;
export type BoardListResponse = PageResponse<Board>;
export type CommentResponse = Comment;

// ========== Preference DTOs ==========
export interface PreferenceRequest {
  species?: 'DOG' | 'CAT';
  minAge?: number;
  maxAge?: number;
  size?: 'SMALL' | 'MEDIUM' | 'LARGE';
  /** 선호 지역 복수 (시·도 단위, 예: ["서울", "경기"]) */
  regions?: string[];
}

export type PreferenceResponse = Preference;

// ========== Admin - Shelter (관리자 보호소 인증) ==========
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ShelterResponse {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  managerId: number | null;
  managerName: string;
  managerPhone: string;
  businessRegistrationNumber: string | null;
  businessRegistrationFile: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface ShelterVerifyRequest {
  status: 'APPROVED' | 'REJECTED';
  rejectReason?: string;
}

// ========== Notification DTOs ==========
export interface NotificationResponse {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  relatedUrl?: string;
  createdAt: string;
}

export type NotificationListResponse = PageResponse<NotificationResponse>;

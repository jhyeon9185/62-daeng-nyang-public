/**
 * Backend Entity 타입 정의
 * 스프링 부트 JPA Entity와 일치
 */

export type Role = 'USER' | 'SHELTER_ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: Role;
  address?: string;
  createdAt: string;
}

export interface Preference {
  id: number;
  userId: number;
  species?: Species;
  minAge?: number;
  maxAge?: number;
  size?: Size;
  /** 선호 지역 복수 (시·도 단위) */
  regions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type Species = 'DOG' | 'CAT';
export type Gender = 'MALE' | 'FEMALE';
export type Size = 'SMALL' | 'MEDIUM' | 'LARGE';
export type AnimalStatus = 'PROTECTED' | 'ADOPTED' | 'FOSTERING';

export interface Animal {
  id: number;
  /** 공공 API 유기번호 (보호소 전화 문의 시 식별용) */
  publicApiAnimalId?: string | null;
  /** 관할기관 (공공 API orgNm) */
  orgName?: string | null;
  /** 담당자 (공공 API chargeNm) */
  chargeName?: string | null;
  /** 담당자 연락처 (공공 API officetel) */
  chargePhone?: string | null;
  shelterId: number;
  shelterName?: string;
  /** 보호소 주소 (상세페이지·지도 표시용) */
  shelterAddress?: string;
  /** 보호소 전화번호 */
  shelterPhone?: string;
  /** 보호소 위도 (지도 마커용) */
  shelterLatitude?: number;
  /** 보호소 경도 */
  shelterLongitude?: number;
  species: Species;
  breed: string;
  name: string;
  age: number;
  gender: Gender;
  size: Size;
  neutered: boolean;
  status: AnimalStatus;
  imageUrl?: string;
  description?: string;
  createdAt: string;
}

export type AdoptionType = 'ADOPTION' | 'FOSTERING';
export type AdoptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Adoption {
  id: number;
  userId: number;
  animalId: number;
  applicantName?: string;
  animalName?: string;
  animal?: Animal;
  type: AdoptionType;
  status: AdoptionStatus;
  reason: string;
  experience: string;
  livingEnv?: string;
  familyAgreement: boolean;
  createdAt: string;
  processedAt?: string;
}

export type RecruitmentStatus = 'RECRUITING' | 'CLOSED' | 'OPEN' | 'COMPLETED';

export interface VolunteerRecruitment {
  id: number;
  shelterId: number;
  shelterName?: string;
  title: string;
  content: string;
  maxApplicants: number;
  currentApplicants: number;
  deadline: string;
  status: RecruitmentStatus;
  createdAt: string;
}

export type VolunteerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Volunteer {
  id: number;
  recruitmentId: number;
  recruitmentTitle?: string;
  recruitment?: VolunteerRecruitment;
  userId: number;
  applicantName: string;
  applicantPhone?: string;
  applicantEmail?: string;
  activityRegion?: string;
  activityField: string;
  startDate: string;
  endDate: string;
  /** 신청 인원 (몇 명이 함께 봉사할지) */
  participantCount?: number;
  /** 신청 내용 (하고 싶은 말, 메모) */
  message?: string;
  status: VolunteerStatus;
  createdAt: string;
}

export type RequestStatus = 'OPEN' | 'CLOSED' | 'COMPLETED';

export interface DonationRequest {
  id: number;
  shelterId: number;
  shelterName?: string;
  title: string;
  content: string;
  itemCategory: string;
  targetQuantity: number;
  currentQuantity: number;
  deadline: string;
  status: RequestStatus;
  createdAt: string;
}

export type DonationStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Donation {
  id: number;
  requestId: number;
  requestTitle?: string;
  request?: DonationRequest;
  userId: number;
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  shelterName?: string;
  itemName?: string;
  quantity?: number;
  deliveryMethod?: string;
  trackingNumber?: string;
  status: DonationStatus;
  createdAt: string;
}

export type BoardType = 'NOTICE' | 'FAQ' | 'FREE' | 'VOLUNTEER' | 'DONATION';

export interface Board {
  id: number;
  userId: number;
  userName?: string;
  shelterId?: number;
  type: BoardType;
  title: string;
  content: string;
  views: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: number;
  boardId: number;
  userId: number;
  userName?: string;
  content: string;
  createdAt: string;
}

export interface Shelter {
  id: number;
  name: string;
  address: string;
  phone: string;
  managerId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  relatedUrl?: string;
  createdAt: string;
}

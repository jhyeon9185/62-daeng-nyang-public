---
name: typescript-types
description: Creates TypeScript type definitions for the project. Use when defining interfaces, types, enums. Keywords: types, typescript, interface, enum, dto.
---

# TypeScript Types Generator

## Purpose
Generate TypeScript type definitions:
- API response/request types
- Entity types matching backend DTOs
- Enum types
- Utility types

## Type File Structure
Location: `frontend/src/types/`

```
types/
├── index.ts          # Re-exports all types
├── auth.types.ts     # Auth related types
├── animal.types.ts   # Animal related types
├── adoption.types.ts # Adoption related types
├── volunteer.types.ts# Volunteer related types
├── donation.types.ts # Donation related types
├── board.types.ts    # Board related types
├── common.types.ts   # Common/shared types
└── api.types.ts      # API response wrapper types
```

## Common Types
Location: `frontend/src/types/common.types.ts`

```typescript
// Pagination
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// API Response Wrapper
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

// Enums
export type Role = 'USER' | 'SHELTER_ADMIN' | 'SUPER_ADMIN';
export type Species = 'DOG' | 'CAT';
export type Size = 'SMALL' | 'MEDIUM' | 'LARGE';
export type Gender = 'MALE' | 'FEMALE';
export type AnimalStatus = 'PROTECTED' | 'ADOPTED' | 'FOSTERING';
export type AdoptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type AdoptionType = 'ADOPTION' | 'FOSTERING';
export type VolunteerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type DonationStatus = 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED';
export type BoardType = 'NOTICE' | 'FAQ' | 'FREE' | 'VOLUNTEER' | 'DONATION';
export type ActivityCycle = 'REGULAR' | 'IRREGULAR';
export type VolunteerType = 'INDIVIDUAL' | 'GROUP';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
```

## Auth Types
Location: `frontend/src/types/auth.types.ts`

```typescript
import type { Role } from './common.types';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: Role;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: Role;
}
```

## Animal Types
Location: `frontend/src/types/animal.types.ts`

```typescript
import type { Species, Size, Gender, AnimalStatus, PageRequest } from './common.types';

export interface Animal {
  id: number;
  shelterId: number;
  shelterName: string;
  species: Species;
  breed?: string;
  name?: string;
  age?: number;
  gender?: Gender;
  size?: Size;
  weight?: number;
  description?: string;
  temperament?: string;
  healthStatus?: string;
  neutered: boolean;
  vaccinated: boolean;
  imageUrl?: string;
  status: AnimalStatus;
  registerDate?: string;
  createdAt: string;
}

export interface AnimalDetail extends Animal {
  shelter: ShelterInfo;
  images: AnimalImage[];
}

export interface AnimalImage {
  id: number;
  imageUrl: string;
  isMain: boolean;
}

export interface ShelterInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
}

export interface AnimalFilterParams extends PageRequest {
  species?: Species;
  size?: Size;
  gender?: Gender;
  status?: AnimalStatus;
  neutered?: boolean;
  region?: string;
  keyword?: string;
}

export interface AnimalCreateRequest {
  shelterId: number;
  species: Species;
  breed?: string;
  name?: string;
  age?: number;
  gender?: Gender;
  size?: Size;
  weight?: number;
  description?: string;
  temperament?: string;
  healthStatus?: string;
  neutered?: boolean;
  vaccinated?: boolean;
  imageUrl?: string;
}

export interface AnimalUpdateRequest extends Partial<AnimalCreateRequest> {
  status?: AnimalStatus;
}
```

## Adoption Types
Location: `frontend/src/types/adoption.types.ts`

```typescript
import type { AdoptionStatus, AdoptionType } from './common.types';
import type { Animal } from './animal.types';
import type { User } from './auth.types';

export interface Adoption {
  id: number;
  user: Pick<User, 'id' | 'name' | 'email'>;
  animal: Pick<Animal, 'id' | 'name' | 'species' | 'imageUrl'>;
  type: AdoptionType;
  status: AdoptionStatus;
  reason?: string;
  experience?: string;
  livingEnv?: string;
  familyAgreement: boolean;
  rejectReason?: string;
  processedAt?: string;
  createdAt: string;
}

export interface AdoptionRequest {
  animalId: number;
  type: AdoptionType;
  reason: string;
  experience?: string;
  livingEnv: string;
  familyAgreement: boolean;
}

export interface AdoptionRejectRequest {
  reason: string;
}
```

## Volunteer Types
Location: `frontend/src/types/volunteer.types.ts`

```typescript
import type { ActivityCycle, VolunteerType, VolunteerStatus, PageRequest } from './common.types';

export interface VolunteerRecruitment {
  id: number;
  shelterId: number;
  shelterName: string;
  title: string;
  content: string;
  activityField: string;
  maxApplicants: number;
  currentApplicants: number;
  volunteerDate: string;
  deadline: string;
  status: 'RECRUITING' | 'CLOSED';
  isUrgent: boolean;
  createdAt: string;
}

export interface Volunteer {
  id: number;
  recruitmentId: number;
  recruitmentTitle: string;
  shelterName: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  activityRegion: string;
  activityField: string;
  volunteerDateStart: string;
  volunteerDateEnd?: string;
  activityCycle: ActivityCycle;
  preferredTimeSlot?: string;
  volunteerType: VolunteerType;
  experience?: string;
  specialNotes?: string;
  status: VolunteerStatus;
  createdAt: string;
}

export interface VolunteerApplyRequest {
  recruitmentId: number;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  activityRegion: string;
  activityField: string;
  volunteerDateStart: string;
  volunteerDateEnd?: string;
  activityCycle: ActivityCycle;
  preferredTimeSlot?: string;
  volunteerType: VolunteerType;
  experience?: string;
  specialNotes?: string;
}

export interface RecruitmentCreateRequest {
  title: string;
  content: string;
  activityField: string;
  maxApplicants: number;
  volunteerDate: string;
  deadline: string;
  isUrgent?: boolean;
}

export interface RecruitmentFilterParams extends PageRequest {
  status?: 'RECRUITING' | 'CLOSED';
  isUrgent?: boolean;
  activityField?: string;
}
```

## Donation Types
Location: `frontend/src/types/donation.types.ts`

```typescript
import type { DonationStatus, PageRequest } from './common.types';

export interface DonationRequest {
  id: number;
  shelterId: number;
  shelterName: string;
  shelterAddress: string;
  title: string;
  content: string;
  itemCategory: string;
  targetQuantity: number;
  currentQuantity: number;
  deadline: string;
  status: 'OPEN' | 'CLOSED';
  isUrgent: boolean;
  progress: number; // percentage
  createdAt: string;
}

export interface Donation {
  id: number;
  requestId: number;
  requestTitle: string;
  shelterName: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  itemName: string;
  quantity: number;
  deliveryMethod: string;
  trackingNumber?: string;
  receiptRequested: boolean;
  status: DonationStatus;
  createdAt: string;
}

export interface DonationApplyRequest {
  requestId: number;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  itemName: string;
  quantity: number;
  deliveryMethod: string;
  trackingNumber?: string;
  receiptRequested?: boolean;
}

export interface DonationRequestCreateRequest {
  title: string;
  content: string;
  itemCategory: string;
  targetQuantity: number;
  deadline: string;
  isUrgent?: boolean;
}

export interface DonationRequestFilterParams extends PageRequest {
  status?: 'OPEN' | 'CLOSED';
  isUrgent?: boolean;
  itemCategory?: string;
}
```

## Board Types
Location: `frontend/src/types/board.types.ts`

```typescript
import type { BoardType, PageRequest } from './common.types';

export interface Board {
  id: number;
  userId: number;
  userName: string;
  shelterId?: number;
  shelterName?: string;
  type: BoardType;
  title: string;
  content: string;
  views: number;
  isPinned: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardDetail extends Board {
  comments: Comment[];
}

export interface Comment {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
}

export interface BoardCreateRequest {
  type: BoardType;
  title: string;
  content: string;
  shelterId?: number;
}

export interface BoardUpdateRequest {
  title?: string;
  content?: string;
  isPinned?: boolean;
}

export interface CommentCreateRequest {
  content: string;
}

export interface BoardFilterParams extends PageRequest {
  type?: BoardType;
  keyword?: string;
}
```

## Index Export
Location: `frontend/src/types/index.ts`

```typescript
// Re-export all types
export * from './common.types';
export * from './auth.types';
export * from './animal.types';
export * from './adoption.types';
export * from './volunteer.types';
export * from './donation.types';
export * from './board.types';
```

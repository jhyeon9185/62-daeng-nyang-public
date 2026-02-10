# 클래스 다이어그램 기준 백엔드 작업 체크리스트

기준 문서: `DN_project_class-diagram_260128.md`  
비교 대상: 프론트엔드 `entities.ts`, `dto.ts`, `api/*.ts`

---

## 1. API 모듈 vs 백엔드 구현 필요 항목

### 1.1 AUTH (인증)

| 다이어그램 API | 프론트 구현 | 백엔드 구현 필요 |
|----------------|-------------|------------------|
| login | ❌ (Placeholder 페이지만 있음) | ✅ **필수** |
| signup | ❌ | ✅ **필수** |
| logout | ❌ | ✅ **필수** |
| getMe | ❌ | ✅ **필수** |
| (refresh) | ✅ axios 인터셉터에서 `/auth/refresh` 호출 | ✅ **필수** |

- **백엔드 필요:** `AuthController` (signup, login, logout, getMe, refresh), `AuthService`, `UserRepository`, JWT 발급/검증
- **참고:** 다이어그램 3.2 회원가입 – 일반회원은 `address` 필수, 보호소 관리자는 `POST /api/auth/signup/shelter` + 사업자등록증 파일

---

### 1.2 ANIMAL (동물)

| 다이어그램 API | 프론트 구현 | 백엔드 구현 필요 |
|----------------|-------------|------------------|
| getAll | ✅ | ✅ |
| getById | ✅ | ✅ |
| create | ❌ | ✅ (관리자/보호소) |
| update | ❌ | ✅ (관리자/보호소) |
| delete | ❌ | ✅ (관리자/보호소) |

- **다이어그램 3.1 Service:** `syncFromPublicApi` – 공공API 동기화 필요
- **Repository:** `findByShelterId`, `findBySpecies`, `findByStatus` 등 검색/필터 지원

---

### 1.3 ADOPTION (입양)

| 다이어그램 API | 프론트 구현 | 백엔드 구현 필요 |
|----------------|-------------|------------------|
| apply | ✅ | ✅ |
| getMyList | ✅ | ✅ |
| cancel | ✅ | ✅ |
| approve | ❌ (관리자용) | ✅ **필수** |
| reject | ❌ (관리자용) | ✅ **필수** |

- **백엔드:** 승인/거절 시 `EmailService`, `NotificationService` 연동 (다이어그램 3.2)

---

### 1.4 VOLUNTEER (봉사)

| 다이어그램 API | 프론트 구현 | 백엔드 구현 필요 |
|----------------|-------------|------------------|
| apply | ✅ | ✅ |
| getMyList | ✅ | ✅ |
| approve | ❌ (관리자용) | ✅ **필수** |
| reject | ❌ (관리자용) | ✅ **필수** |

- **다이어그램 Controller:** `createRecruitment`, `getAllRecruitments` 포함
- **프론트:** `getAllRecruitments`, `getRecruitmentById` 이미 호출 → 백엔드에 **봉사 모집공고 등록 API 필요**
  - `POST /volunteers/recruitments` (보호소 관리자) – createRecruitment
  - `GET /volunteers/recruitments`, `GET /volunteers/recruitments/:id` – 이미 프론트에서 사용 중

---

### 1.5 DONATION (기부)

| 다이어그램 API | 프론트 구현 | 백엔드 구현 필요 |
|----------------|-------------|------------------|
| donate | ✅ | ✅ |
| getMyList | ✅ | ✅ |
| complete | ❌ | ✅ **필수** (수령 완료 처리) |

- **다이어그램 Controller:** `createRequest`, `getAllRequests` 포함
- **프론트:** `getAllRequests`, `getRequestById` 이미 호출 → 백엔드에 **물품 요청 등록 API 필요**
  - `POST /donations/requests` (보호소) – createRequest
  - `GET /donations/requests`, `GET /donations/requests/:id` – 목록/상세
- **complete:** 보호소가 기부 물품 수령 완료 시 상태 변경용 API 필요 (다이어그램 DONATION_API)

---

### 1.6 BOARD (게시판)

| 다이어그램 API | 프론트 구현 | 백엔드 구현 필요 |
|----------------|-------------|------------------|
| getAll | ✅ | ✅ |
| create | ✅ | ✅ |
| addComment | ✅ | ✅ |
| (getById) | ✅ | ✅ |
| (getComments) | ✅ | ✅ |

- **BoardType 불일치**
  - **다이어그램 4.4:** `NOTICE`, `FAQ`, `FREE`, **`VOLUNTEER`**, **`DONATION`**
  - **프론트 entities:** `NOTICE`, `FAQ`, `FREE`, **`REVIEW`**
  - **백엔드 권장:** 다이어그램 기준 5종 지원 시 `VOLUNTEER`, `DONATION` 추가. `REVIEW`는 다이어그램에 없으므로 요구사항에 따라 추가 여부 결정.

---

## 2. Entity 기준 누락/보완 사항

### 2.1 다이어그램에 있으나 프론트 Entity 없음

| Entity | 다이어그램 | 프론트 entities.ts | 비고 |
|--------|------------|---------------------|------|
| **Notification** | 4.4 (NOTIFICATION) | ❌ 없음 | 백엔드 **Notification** 엔티티·리포지토리·서비스·API(또는 SSE) 필요. 입양/봉사/기부 승인·거절 시 알림 발송 |

### 2.2 엔티티 필드 정합성 (백엔드 구현 시 참고)

- **User:** 다이어그램: id, email, password, name, phone, Role. (다른 문서에 nickname, address, profile_image_url, social_type 있음 – 요구사항에 따라 추가)
- **Adoption:** reason, experience, livingEnv?, familyAgreement – 프론트 DTO와 일치
- **Donation:** deliveryMethod, trackingNumber, DonationStatus – 프론트와 일치
- **Board:** 다이어그램에선 `shelterId` 선택(보호소 연결). 프론트에선 `shelterId?` 있음

---

## 3. Backend Layer별 구현 체크

### 3.1 Controller (다이어그램 3.1 기준)

| Controller | 필수 엔드포인트 | 비고 |
|------------|-----------------|------|
| AuthController | signup, login, logout, getMe, refresh | - |
| AnimalController | getAll, getById, create, update, delete | - |
| AdoptionController | apply, getMyList, cancel, **approve**, **reject** | 관리자용 approve/reject |
| VolunteerController | **createRecruitment**, getAllRecruitments, getRecruitmentById, apply, **approve**, **reject** | createRecruitment = 모집공고 등록 |
| DonationController | **createRequest**, getAllRequests, getRequestById, donate, getMyList, **complete** | complete = 수령 완료 |
| BoardController | getAll, getById, create, addComment, getComments | - |
| **NotificationController** | (다이어그램 3.5) 구독/목록/읽음 처리 또는 SSE | 알림 조회·구독·읽음 처리 |

### 3.2 Service (다이어그램 3.2 기준)

| Service | 비고 |
|---------|------|
| AuthService | signup, login, refreshToken, 비밀번호 검증·토큰 발급 |
| AnimalService | findAll, **syncFromPublicApi** (공공API 동기화) |
| AdoptionService | apply, approve, reject, **EmailService/NotificationService 호출** |
| VolunteerService | createRecruitment, apply, approve, reject, 알림 연동 |
| DonationService | createRequest, donate, **complete**, 알림 연동 |
| **EmailService** | sendWelcomeEmail, sendApprovalEmail, sendRejectionEmail (Resend 등) |
| **NotificationService** | 알림 생성·저장·SSE 발송 |
| BoardService | 게시글·댓글 CRUD |

### 3.3 Repository (다이어그램 3.3 + ERD 기준)

| Repository | 비고 |
|-------------|------|
| UserRepository | findByEmail, existsByEmail |
| AnimalRepository | findByShelterId, findBySpecies, findByStatus 등 |
| AdoptionRepository | findByUserId, findByAnimalId |
| **VolunteerRecruitmentRepository** | (모집공고용) |
| **VolunteerRepository** | (봉사 신청용) |
| **DonationRequestRepository** | (물품 요청용) |
| **DonationRepository** | (기부 신청용) |
| **BoardRepository** | |
| **CommentRepository** | |
| **NotificationRepository** | |
| **ShelterRepository** | (보호소 관리·인증) |
| **PreferenceRepository** | (선호조건) |

---

## 4. DTO / 공통 응답

- **Request DTO:** SignupRequest(address 포함 여부·보호소 가입 분리), LoginRequest, AdoptionRequest, VolunteerApplyRequest, DonationApplyRequest, BoardCreateRequest 등 – 프론트 dto.ts와 맞추면 됨.
- **Response:** ApiResponse&lt;T&gt;, PageResponse&lt;T&gt;, TokenResponse, UserResponse 등 – 다이어그램 5.2와 동일하게 구현 권장.
- **에러 응답:** 프론트에 ErrorResponse 정의 있음 – status, message, errors?, timestamp 등 동일하게 맞추기.

---

## 5. 정리: 백엔드에서 우선 구현할 것

1. **인증:** AuthController/Service/UserRepository, JWT, signup, login, logout, getMe, refresh
2. **알림:** Notification 엔티티·Repository·Service·Controller(또는 SSE), 입양/봉사/기부 승인·거절 시 연동
3. **입양:** approve, reject API
4. **봉사:** createRecruitment (모집공고 등록), approve, reject
5. **기부:** createRequest (물품 요청 등록), complete (수령 완료)
6. **동물:** create, update, delete (관리자/보호소), 공공API 동기화(AnimalService.syncFromPublicApi)
7. **이메일:** EmailService (가입 환영, 승인/거절 알림) – Resend 등
8. **BoardType:** 다이어그램 기준으로 VOLUNTEER, DONATION 타입 지원 여부 결정 후 엔티티/ENUM 반영

이 체크리스트를 기준으로 백엔드 API·엔티티·서비스를 구현하면 다이어그램과의 정합성을 맞출 수 있습니다.

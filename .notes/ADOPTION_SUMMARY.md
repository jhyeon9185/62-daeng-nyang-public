# 🐾 입양(Adoption) 기능 요약

## 📂 파일 구조

| 레이어 | 파일 | 설명 |
|--------|------|------|
| **Domain** | `Adoption.java` | 입양 엔티티 |
| **Constant** | `AdoptionType.java` | `ADOPTION`(입양) / `FOSTERING`(임시보호) |
| **Constant** | `AdoptionStatus.java` | `PENDING` → `APPROVED` / `REJECTED` / `CANCELLED` |
| **Repository** | `AdoptionRepository.java` | JPA 쿼리 메서드 |
| **Service** | `AdoptionService.java` | 핵심 비즈니스 로직 |
| **Controller** | `AdoptionController.java` | REST API 엔드포인트 |
| **DTO** | `AdoptionRequest.java` / `AdoptionResponse.java` | 요청/응답 DTO |
| **Frontend API** | `adoption.ts` | 프론트엔드 API 호출 모듈 |
| **Frontend Type** | `entities.ts` | TypeScript 타입 정의 |

---

## 🔄 입양 신청 흐름

```
사용자 신청 → PENDING → 관리자 검토 → APPROVED / REJECTED
                ↓
            사용자 취소 → CANCELLED
```

---

## 📡 API 엔드포인트 (`/api/adoptions`)

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| `POST` | `/` | 입양/임보 신청 | 로그인 사용자 |
| `GET` | `/my` | 내 신청 목록 | 로그인 사용자 |
| `PUT` | `/{id}/cancel` | 신청 취소 | 본인만 |
| `GET` | `/shelter/pending` | 보호소 대기 목록 | 보호소 관리자 |
| `PUT` | `/{id}/approve` | 승인 | 관리자 |
| `PUT` | `/{id}/reject` | 거절 | 관리자 |

---

## 📋 신청 요청 필드 (`AdoptionRequest`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `animalId` | Long | ✅ | 동물 ID |
| `type` | AdoptionType | ✅ | `ADOPTION` / `FOSTERING` |
| `reason` | String | - | 신청 사유 |
| `experience` | String | - | 반려동물 경험 |
| `livingEnv` | String | - | 주거 환경 |
| `familyAgreement` | Boolean | ✅ | 가족 동의 여부 |

---

## 🔔 알림/이메일 연동

- **신청 접수 시**: 신청자에게 접수 확인 이메일 발송 + 보호소 관리자에게 알림/이메일
- **승인 시**: 신청자에게 승인 이메일 발송
- **거절 시**: 신청자에게 거절 사유 포함 이메일 발송

---

## 🖥️ 프론트엔드 사용처

| 페이지 | 설명 |
|--------|------|
| `MyPage.tsx` | 내 입양 신청 내역 표시 |
| `AdminDashboardPage.tsx` | 관리자용 대기 신청 승인/거절 |
| `GuideAdoptionPage.tsx` | 입양 안내 페이지 |
| `AnimalDetailPage.tsx` | 동물 상세 → 입양 신청 링크 |

---

## 🗂️ 관련 파일 경로

### Backend
- `backend/src/main/java/com/dnproject/platform/domain/Adoption.java`
- `backend/src/main/java/com/dnproject/platform/domain/constant/AdoptionType.java`
- `backend/src/main/java/com/dnproject/platform/domain/constant/AdoptionStatus.java`
- `backend/src/main/java/com/dnproject/platform/repository/AdoptionRepository.java`
- `backend/src/main/java/com/dnproject/platform/service/AdoptionService.java`
- `backend/src/main/java/com/dnproject/platform/controller/AdoptionController.java`
- `backend/src/main/java/com/dnproject/platform/dto/request/AdoptionRequest.java`
- `backend/src/main/java/com/dnproject/platform/dto/response/AdoptionResponse.java`

### Frontend
- `frontend/src/api/adoption.ts`
- `frontend/src/types/entities.ts`
- `frontend/src/types/dto.ts`
- `frontend/src/pages/auth/MyPage.tsx`
- `frontend/src/pages/admin/AdminDashboardPage.tsx`
- `frontend/src/pages/guide/GuideAdoptionPage.tsx`
- `frontend/src/pages/animals/AnimalDetailPage.tsx`
- `frontend/src/components/landing/AdoptableSection.tsx`

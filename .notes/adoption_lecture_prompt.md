# 62dn 프로젝트 – 입양/임시보호 기능 강의자료(PPT) + 대본 작성 프롬프트

---

## 프롬프트 사용법

아래 프롬프트를 **ChatGPT, Gemini, Claude 등의 AI**에 그대로 복사·붙여넣기 하면, 해당 AI가 PPT 슬라이드 구성안 + 강의 대본을 생성해 줍니다.
필요에 따라 `[슬라이드 수]`, `[시간]`, `[청중 수준]` 등을 조정하세요.

---

## 프롬프트 본문

```
당신은 소프트웨어 공학 강사입니다.
아래에 제공하는 "62dn" 프로젝트의 **입양(Adoption)** 및 **임시보호(Fostering)** 기능에 대해,
이 프로젝트에 참여하지 않은 사람(비전공자 포함)도 쉽게 이해할 수 있도록
**PPT 강의자료(슬라이드 구성안)** 와 **슬라이드별 강의 대본** 을 만들어 주세요.

━━━━━━━━━━━━━━━━━━━━
📌 요구사항
━━━━━━━━━━━━━━━━━━━━

1. **슬라이드 수**: 15 ~ 20장
2. **목표 강의 시간**: 약 30분
3. **청중 수준**: 프로그래밍 기초 수준 (Spring Boot, React를 들어본 적은 있으나 실무 경험 부족)
4. **출력 형식**:
   - 각 슬라이드마다 ① 제목, ② 핵심 불렛 포인트(3~5개), ③ 시각 자료 제안(다이어그램·화면 캡처 종류), ④ 강의 대본(1~2분 분량의 구어체 스크립트)
5. **언어**: 전체 한국어. 기술 용어(Entity, Controller 등)는 영어 병기.
6. **대본 톤**: 비유와 일상적 표현을 적극 활용하여 비전공자도 이해할 수 있게.
7. PPT의 첫 슬라이드는 타이틀 슬라이드, 마지막 슬라이드는 Q&A 슬라이드로 구성.

━━━━━━━━━━━━━━━━━━━━
📂 프로젝트 개요
━━━━━━━━━━━━━━━━━━━━

- **프로젝트명**: 62dn (62댕냥) — 유기동물 입양·보호 플랫폼
- **기술 스택**:
  - Backend: Java 17 + Spring Boot 3 + JPA/Hibernate + PostgreSQL
  - Frontend: React + TypeScript + Vite + TailwindCSS
- **입양/임시보호 기능 요약**: 사용자가 유기동물을 입양하거나 임시보호를 신청하고, 보호소 관리자가 승인/거절하는 프로세스. 신청 시 이메일 알림 + 인앱 알림 자동 발송.

━━━━━━━━━━━━━━━━━━━━
🏗️ 아키텍처 & 데이터 흐름
━━━━━━━━━━━━━━━━━━━━

전체 흐름은 3-계층(3-Layer) 구조:
  React 프론트엔드 → Spring Boot REST API → PostgreSQL DB

요청-응답 흐름:
  사용자 브라우저 → [adoption.ts API 모듈] → HTTP POST/GET/PUT
    → [AdoptionController] → [AdoptionService] → [AdoptionRepository (JPA)]
    → PostgreSQL adoptions 테이블

━━━━━━━━━━━━━━━━━━━━
📋 핵심 코드 구성 (파일별 역할)
━━━━━━━━━━━━━━━━━━━━

### 1. 백엔드 (Java / Spring Boot)

#### 1-1. Entity — Adoption.java
- JPA Entity. DB의 `adoptions` 테이블과 매핑.
- 주요 필드:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | id | Long (PK, AUTO) | 신청 고유 ID |
  | user | User (ManyToOne, Lazy) | 신청자 |
  | animal | Animal (ManyToOne, Lazy) | 대상 동물 |
  | type | AdoptionType (Enum) | ADOPTION(입양) / FOSTERING(임시보호) |
  | status | AdoptionStatus (Enum) | PENDING → APPROVED / REJECTED / CANCELLED |
  | reason | String (TEXT) | 신청 사유 |
  | experience | String (TEXT) | 반려 경험 |
  | livingEnv | String (TEXT) | 주거 환경 |
  | familyAgreement | Boolean | 가족 동의 여부 |
  | rejectReason | String (TEXT) | 거절 사유 (관리자 입력) |
  | processedAt | LocalDateTime | 처리 일시 |
  | createdAt / updatedAt | Instant | 생성·수정 시각 (자동) |
- 인덱스: user_id, animal_id, status
- @PrePersist / @PreUpdate 로 타임스탬프 자동 설정

#### 1-2. Enum — AdoptionType.java
```java
public enum AdoptionType {
    ADOPTION,   // 입양
    FOSTERING   // 임시보호
}
```

#### 1-3. Enum — AdoptionStatus.java
```java
public enum AdoptionStatus {
    PENDING,    // 대기
    APPROVED,   // 승인
    REJECTED,   // 거절
    CANCELLED   // 취소
}
```
→ 상태 전이: PENDING → APPROVED | REJECTED | CANCELLED (PENDING 상태에서만 변경 가능)

#### 1-4. Controller — AdoptionController.java
- 기본 경로: `/api/adoptions`
- Swagger 태그: "Adoption"
- 엔드포인트 목록:
  | HTTP Method | 경로 | 설명 | 권한 |
  |---|---|---|---|
  | POST | `/api/adoptions` | 입양/임보 신청 | 인증 사용자 |
  | GET | `/api/adoptions/shelter/pending` | 보호소 대기 신청 목록 | 보호소 관리자 |
  | GET | `/api/adoptions/my` | 내 신청 목록 | 인증 사용자 |
  | PUT | `/api/adoptions/{id}/cancel` | 신청 취소 | 본인 |
  | PUT | `/api/adoptions/{id}/approve` | 신청 승인 | 관리자 |
  | PUT | `/api/adoptions/{id}/reject` | 신청 거절 | 관리자 |
- 인증: HttpServletRequest의 `userId` attribute에서 JWT 인증 사용자 ID 추출
- 응답 래퍼: `ApiResponse<T>` (status, message, data, timestamp)

#### 1-5. Service — AdoptionService.java (핵심 비즈니스 로직)
- **apply(신청)**: User·Animal 조회 → Adoption 엔티티 빌드·저장 → 신청자에게 접수 이메일 → 관리자에게 인앱 알림 + 이메일
- **cancel(취소)**: 본인 확인 + PENDING 상태 확인 → CANCELLED
- **approve(승인)**: PENDING 확인 → APPROVED, processedAt 기록 → 신청자에게 승인 이메일
- **reject(거절)**: PENDING 확인 → REJECTED, rejectReason·processedAt 기록 → 신청자에게 거절 이메일
- **getPendingByShelter**: 보호소별 대기 신청 페이징 조회
- **getPendingByShelterForCurrentUser**: 현재 로그인 관리자의 보호소 자동 식별
- **getAllForAdmin**: 시스템 관리자 전체 목록
- **getMyList**: 사용자 본인 신청 내역
- **toResponse**: Entity → DTO 변환 (applicantName, animalName 포함)
- **notifyAndEmailAdmin**: 보호소 관리자에게 알림·이메일 자동 발송 (보호소·담당자 이메일 우선순위)

#### 1-6. Repository — AdoptionRepository.java
- JpaRepository 상속
- Spring Data JPA 쿼리 메서드:
  - `findAllByOrderByCreatedAtDesc` — 전체 최신순
  - `findByUser_IdOrderByCreatedAtDesc` — 사용자별
  - `findByAnimal_Id` — 동물별
  - `findByAnimal_Shelter_IdAndStatusOrderByCreatedAtDesc` — 보호소별·상태별
  - `countByUser_IdAndStatus` — 사용자·상태별 건수

#### 1-7. DTO
- **AdoptionRequest**: animalId(필수), type(필수), reason, experience, livingEnv, familyAgreement(필수)
- **AdoptionResponse**: id, userId, animalId, applicantName, animalName, type, status, reason, experience, livingEnv, createdAt

#### 1-8. 연동 서비스
- **EmailService**: Resend API로 이메일 발송
  - sendApplicationReceivedEmail (신청자에게 접수 확인)
  - sendApplicationReceivedToAdmin (관리자에게 새 신청 알림)
  - sendApprovalEmail (승인 알림)
  - sendRejectionEmail (거절 알림 + 사유)
- **NotificationService**: 인앱 알림 생성 (DB 저장, 타입: "ADOPTION_APPLICATION")

### 2. 프론트엔드 (React + TypeScript)

#### 2-1. API 모듈 — adoption.ts
- axios 인스턴스 사용
- 메서드:
  | 함수 | HTTP | 설명 |
  |------|------|------|
  | apply(data) | POST /adoptions | 신청 |
  | getMyList(page, size) | GET /adoptions/my | 내 목록 |
  | cancel(id) | PATCH /adoptions/{id}/cancel | 취소 |
  | getByAnimalId(id) | GET /adoptions/animal/{id} | 동물별 조회 |
  | getPendingByShelter(page, size) | GET /adoptions/shelter/pending | 보호소 대기 |
  | approve(id) | PUT /adoptions/{id}/approve | 승인 |
  | reject(id, reason) | PUT /adoptions/{id}/reject | 거절 |

#### 2-2. 타입 정의
- entities.ts: `Adoption` 인터페이스 (id, userId, animalId, type, status, reason, experience 등)
- dto.ts: `AdoptionRequest` (animalId, type, reason, experience, livingEnv, familyAgreement)
- `AdoptionType` = 'ADOPTION' | 'FOSTERING'
- `AdoptionStatus` = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

#### 2-3. 입양 절차 안내 페이지 — GuideAdoptionPage.tsx
- 6단계 안내: 필수교육 → 대기동물 확인 → 상담 예약 → 동물 만남 → 계약·확정 → 사후 관리
- animalId 쿼리 파라미터로 특정 동물 정보 로드 가능
- GuideCallBlock 컴포넌트로 보호소 전화 연결 지원

#### 2-4. 임시보호 절차 안내 페이지 — GuideFosterPage.tsx
- 4단계 안내: 신청서 작성 → 가정환경 점검 → 계약서 작성 → 동물 인수
- 구조·디자인은 입양 가이드와 동일 (파란색 테마)

#### 2-5. GuideCallBlock.tsx 컴포넌트
- 입양/임보 공통 재사용 컴포넌트
- 동물의 유기번호, 보호소명, 담당자 전화번호 표시
- "예시 문구 복사" 기능 (클립보드)
- 입양=녹색(green), 임보=파란색(blue) 스타일 분기

━━━━━━━━━━━━━━━━━━━━
🔄 핵심 프로세스 다이어그램
━━━━━━━━━━━━━━━━━━━━

입양/임시보호 신청 프로세스:
1. 사용자가 동물 상세 페이지에서 "입양 신청" 또는 "임보 신청" 클릭
2. 프론트엔드 → POST /api/adoptions (type: ADOPTION 또는 FOSTERING)
3. AdoptionService.apply():
   a) User, Animal 조회 (없으면 404)
   b) Adoption 엔티티 생성 (status=PENDING)
   c) DB 저장
   d) 신청자에게 접수 확인 이메일 발송
   e) 보호소 관리자에게 인앱 알림 + 이메일 발송
4. 응답 반환 (AdoptionResponse)

관리자 승인/거절 프로세스:
1. 관리자가 관리 페이지에서 대기 신청 목록 조회 (GET /api/adoptions/shelter/pending)
2. 승인: PUT /api/adoptions/{id}/approve → status=APPROVED, processedAt 기록, 승인 이메일
3. 거절: PUT /api/adoptions/{id}/reject → status=REJECTED, rejectReason·processedAt 기록, 거절 이메일

사용자 취소 프로세스:
1. 내 신청 목록에서 PENDING 상태 신청건 선택
2. PUT /api/adoptions/{id}/cancel → 본인 확인 → status=CANCELLED

상태 전이도:
  [PENDING] ──승인──→ [APPROVED]
  [PENDING] ──거절──→ [REJECTED]
  [PENDING] ──취소──→ [CANCELLED]
  (PENDING 이외 상태에서는 변경 불가)

━━━━━━━━━━━━━━━━━━━━
📝 슬라이드 구성 가이드
━━━━━━━━━━━━━━━━━━━━

아래 구성을 권장합니다. 필요 시 조정하세요:

1. **타이틀 슬라이드** — 62dn 입양/임시보호 기능 개요
2. **프로젝트 소개** — 62댕냥이란? 전체 기술 스택 소개
3. **입양/임시보호란?** — 입양 vs 임시보호 개념 비교 (비전공자용)
4. **전체 아키텍처** — 3-Layer 구조 다이어그램 (React → Spring Boot → DB)
5. **데이터 모델** — Adoption Entity의 필드와 관계 (User, Animal과의 연관)
6. **상태 머신** — AdoptionStatus 상태 전이도 (PENDING → APPROVED/REJECTED/CANCELLED)
7. **API 설계** — REST 엔드포인트 목록 표
8. **신청 프로세스 (사용자 관점)** — 사용자가 신청하는 전체 흐름
9. **신청 프로세스 (코드 관점)** — AdoptionService.apply() 로직 단계별 설명
10. **관리자 승인/거절 프로세스** — approve(), reject() 로직
11. **알림 시스템 연동** — 이메일(Resend) + 인앱 알림 발송 흐름
12. **프론트엔드 — API 모듈** — adoption.ts의 axios 호출 구조
13. **프론트엔드 — 입양 가이드 페이지** — GuideAdoptionPage 6단계 안내 화면
14. **프론트엔드 — 임보 가이드 페이지** — GuideFosterPage 4단계 안내 화면
15. **프론트엔드 — GuideCallBlock** — 공용 전화연결 컴포넌트 재사용
16. **검증 & 에러 핸들링** — @Valid, CustomException, 상태 체크
17. **입양 vs 임시보호 통합 설계** — AdoptionType enum으로 하나의 테이블로 통합한 이유
18. **전체 시퀀스 다이어그램** — 신청 → 이메일/알림 → 관리자 승인까지 전체 시퀀스
19. **정리 & 핵심 포인트** — 오늘 배운 내용 요약
20. **Q&A** — 질문 시간

━━━━━━━━━━━━━━━━━━━━
⚠️ 추가 지시사항
━━━━━━━━━━━━━━━━━━━━

- 각 슬라이드의 **시각 자료 제안**에는 "시퀀스 다이어그램", "ER 다이어그램", "상태 전이도", "코드 스니펫 하이라이트", "화면 목업" 등 구체적인 종류를 명시하세요.
- 대본에서는 **비유**를 적극 사용하세요. 예: "Entity는 서류 양식, Repository는 서류 보관함, Service는 담당 직원" 등
- 코드를 보여줄 때는 전체 코드가 아닌 **핵심 라인 3~5줄만** 발췌하여 설명하세요.
- 입양과 임시보호가 같은 코드(Adoption Entity, AdoptionType enum)로 통합된 설계 결정을 강조하세요. 이것이 코드 중복을 줄이는 실무적 설계라는 점을 설명하세요.
- 상태 관리(PENDING → APPROVED/REJECTED/CANCELLED)가 왜 중요한지, 실무에서 "이미 처리된 건을 다시 처리하면 안 되는 이유"를 일상 비유로 설명하세요.
```

---

> **TIP**: 이 프롬프트를 AI에 전달한 뒤, 원하는 슬라이드 수·시간·대상을 조정하거나, 특정 슬라이드를 더 상세히 해달라고 후속 요청하면 됩니다.

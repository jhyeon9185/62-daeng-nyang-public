# 🐾 입양/임보 기능 스터디 체크리스트

> 팀 스터디를 주도하기 위한 학습 순서. 각 단계를 순서대로 진행하세요.

---

## Phase 1. 도메인 이해 (기초)

> **목표**: "입양/임보가 코드에서 어떤 데이터로 표현되는가"를 이해

- [ ] **Enum 상수 읽기** — 전체 흐름의 키워드를 먼저 파악
  - [ ] [AdoptionType.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/domain/constant/AdoptionType.java): `ADOPTION`(입양) vs `FOSTERING`(임시보호) 차이 정리
  - [ ] [AdoptionStatus.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/domain/constant/AdoptionStatus.java): 상태 전이 흐름(`PENDING → APPROVED / REJECTED / CANCELLED`) 다이어그램 그려보기
- [ ] **엔티티 읽기**
  - [ ] [Adoption.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/domain/Adoption.java): 각 필드의 의미 파악
  - [ ] 연관관계 확인: `User`(N:1), `Animal`(N:1) — "누가 어떤 동물에 대해 신청했는가"
  - [ ] JPA 어노테이션 이해: `@ManyToOne`, `@Builder.Default`, `@PrePersist`
- [ ] **동물 엔티티 연결 이해**
  - [ ] [Animal.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/domain/Animal.java): `AnimalStatus` 상태값이 입양과 어떻게 연동되는지 파악
  - [ ] [Shelter.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/domain/Shelter.java): 보호소와 동물의 관계 이해

---

## Phase 2. API 계층 (데이터 흐름)

> **목표**: "프론트엔드와 백엔드가 어떤 데이터를 주고받는지" 파악

- [ ] **DTO 읽기**
  - [ ] [AdoptionRequest.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/dto/request/AdoptionRequest.java): 신청 시 필수/선택 필드, 유효성 검증 어노테이션
  - [ ] [AdoptionResponse.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/dto/response/AdoptionResponse.java): 응답에 어떤 정보가 포함되는지
- [ ] **컨트롤러 읽기**
  - [ ] [AdoptionController.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/controller/AdoptionController.java): 6개 엔드포인트 정리
    - `POST /api/adoptions` — 신청
    - `GET /api/adoptions/my` — 내 목록
    - `PUT /api/adoptions/{id}/cancel` — 취소
    - `GET /api/adoptions/shelter/pending` — 보호소 대기 목록
    - `PUT /api/adoptions/{id}/approve` — 승인
    - `PUT /api/adoptions/{id}/reject` — 거절
  - [ ] `getUserId()` 메서드: JWT에서 사용자 ID를 추출하는 방식 이해
- [ ] **보안 설정 확인**
  - [ ] [SecurityConfig.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/config/SecurityConfig.java): `/api/adoptions/**`가 `authenticated`로 설정된 이유 이해
  - [ ] 역할별 접근 권한: 일반 사용자 vs 보호소 관리자 vs 시스템 관리자

---

## Phase 3. 비즈니스 로직 (핵심)

> **목표**: "신청부터 승인/거절까지 실제 로직이 어떻게 동작하는지" 깊이 이해

- [ ] **AdoptionService 메서드별 분석**
  - [ ] [AdoptionService.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/service/AdoptionService.java)를 열고 아래 순서로 읽기:
  - [ ] `apply()` — 신청 로직
    - 중복 신청 방지 체크가 있는지?
    - Animal 상태 검증은?
    - 트랜잭션 범위 확인
  - [ ] `cancel()` — 취소 로직
    - 본인 신청만 취소 가능한 검증
    - PENDING 상태에서만 취소 가능한지?
  - [ ] `approve()` — 승인 로직
    - 동물 상태가 ADOPTED로 변경되는지?
    - 다른 대기 신청은 어떻게 처리?
  - [ ] `reject()` — 거절 로직
    - 거절 사유(`rejectReason`) 저장
  - [ ] `notifyAndEmailAdmin()` — 알림 연동
    - 이메일 발송 로직 이해 (Resend SDK)
    - 비동기(`@Async`) 처리 여부 확인
- [ ] **Repository 쿼리 확인**
  - [ ] [AdoptionRepository.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/repository/AdoptionRepository.java): 커스텀 쿼리 메서드 파악
- [ ] **이메일 서비스 연동**
  - [ ] [EmailService.java](file:///c:/workspace/62dn/backend/src/main/java/com/dnproject/platform/service/EmailService.java): 입양 관련 이메일 템플릿 확인

---

## Phase 4. 프론트엔드 연동

> **목표**: "사용자가 실제로 보는 화면에서 어떻게 동작하는가" 파악

- [ ] **API 호출 모듈**
  - [ ] [adoption.ts](file:///c:/workspace/62dn/frontend/src/api/adoption.ts): 7개 함수 각각이 어떤 Backend API를 호출하는지 매핑
- [ ] **타입 정의**
  - [ ] [dto.ts](file:///c:/workspace/62dn/frontend/src/types/dto.ts): `AdoptionRequest`, `AdoptionResponse` 타입 확인
  - [ ] [entities.ts](file:///c:/workspace/62dn/frontend/src/types/entities.ts): `Adoption` 엔티티 타입
- [ ] **페이지 컴포넌트 읽기** (사용자 흐름 순서대로)
  - [ ] [AnimalDetailPage.tsx](file:///c:/workspace/62dn/frontend/src/pages/animals/AnimalDetailPage.tsx): 동물 상세 → 입양 신청 버튼
  - [ ] [GuideAdoptionPage.tsx](file:///c:/workspace/62dn/frontend/src/pages/guide/GuideAdoptionPage.tsx): 입양 절차 안내
  - [ ] [MyPage.tsx](file:///c:/workspace/62dn/frontend/src/pages/auth/MyPage.tsx): 내 입양 신청 내역
  - [ ] [AdminDashboardPage.tsx](file:///c:/workspace/62dn/frontend/src/pages/admin/AdminDashboardPage.tsx): 관리자 승인/거절 UI

---

## Phase 5. 통합 흐름 실습

> **목표**: 실제 동작을 눈으로 확인하며 전체 흐름을 체화

- [ ] **시나리오 1: 입양 신청**
  1. 로그인 → 동물 목록 → 상세 페이지
  2. 입양 신청 폼 작성 → 제출
  3. 마이페이지에서 "PENDING" 상태 확인
- [ ] **시나리오 2: 관리자 승인/거절**
  1. 관리자 로그인 → 대시보드
  2. 대기 신청 목록에서 승인 또는 거절
  3. 사용자 측에서 상태 변경 확인
- [ ] **시나리오 3: 신청 취소**
  1. PENDING 상태의 신청을 취소
  2. 상태가 CANCELLED로 변경 확인

---

## Phase 6. 심화 토론 주제

> 스터디에서 팀원들과 논의할 포인트

- [ ] **상태 전이 규칙**: "APPROVED된 신청을 다시 PENDING으로 되돌릴 수 있어야 하는가?"
- [ ] **동시성 문제**: "같은 동물에 여러 명이 동시 입양 신청하면?"
- [ ] **확장성**: "입양 후 후기 작성, 파양 프로세스 추가 시 어떤 구조 변경이 필요한가?"
- [ ] **쇼핑몰 패턴 차용**: `Item → Animal`, `Order → Adoption` 매핑이 적절한지 토론
- [ ] **테스트 커버리지**: 신청/승인/거절 각 시나리오에 대한 단위 테스트가 존재하는지 확인

---

## 📌 스터디 진행 팁

| 순서 | 시간 | 활동 |
|------|------|------|
| 1 | 10분 | Phase 1-2 핵심 요약 발표 |
| 2 | 15분 | Phase 3 코드 워크스루 (화면 공유) |
| 3 | 10분 | Phase 4 프론트-백 연결 시연 |
| 4 | 10분 | Phase 5 라이브 데모 |
| 5 | 15분 | Phase 6 토론 |

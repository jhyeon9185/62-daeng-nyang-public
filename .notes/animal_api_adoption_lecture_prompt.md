# 62dn 프로젝트 – 동물정보(공공API) & 입양/임시보호 기능 강의자료(PPT) + 대본 작성 프롬프트

---

```
당신은 소프트웨어 공학 강사입니다.
아래에 제공하는 "62dn" 프로젝트의 **동물정보(공공API 연동)** 및 **입양(Adoption)/임시보호(Fostering)** 기능에 대해,
개발 초보(프로그래밍 기초를 막 배운 수준)도 쉽게 이해할 수 있도록
**PPT 강의자료(슬라이드 구성안)** 와 **슬라이드별 상세 강의 대본** 을 만들어 주세요.

━━━━━━━━━━━━━━━━━━━━
📌 요구사항
━━━━━━━━━━━━━━━━━━━━

1. **슬라이드 수**: 25 ~ 35장
2. **목표 강의 시간**: 약 60분
3. **청중 수준**: 개발 초보 (Java, Spring Boot, React를 들어본 적은 있으나 실무 경험 없음. API가 뭔지는 알지만 실제로 외부 API를 연동해본 적은 없는 수준)
4. **출력 형식**:
   - 각 슬라이드마다 ① 제목, ② 핵심 불렛 포인트(3~5개), ③ 시각 자료 제안(다이어그램·화면 캡처 종류 등), ④ 강의 대본(2~3분 분량의 구어체 스크립트)
5. **언어**: 전체 한국어. 기술 용어(Entity, Controller, API 등)는 영어 병기.
6. **대본 톤**: 비유와 일상적 표현을 적극 활용하여 초보자도 이해할 수 있게. "~합니다" 경어체 사용.
7. PPT의 첫 슬라이드는 타이틀 슬라이드, 마지막 슬라이드는 Q&A 슬라이드로 구성.
8. **2개 파트로 구성**: 파트 1은 "동물정보 — 공공API 연동", 파트 2는 "입양/임시보호 기능"으로 나누어 구성하되, 두 파트가 유기적으로 연결되는 흐름을 보여주세요.

━━━━━━━━━━━━━━━━━━━━
📂 프로젝트 개요
━━━━━━━━━━━━━━━━━━━━

- **프로젝트명**: 62dn (62댕냥) — 유기동물 입양·보호 플랫폼
- **기술 스택**:
  - Backend: Java 17 + Spring Boot 3 + JPA/Hibernate + PostgreSQL
  - Frontend: React + TypeScript + Vite + TailwindCSS
  - 외부 연동: 공공데이터포털 국가동물보호정보시스템 API (v2), Resend(이메일), 카카오맵
- **핵심 기능 요약**:
  1. 공공데이터포털 API에서 전국 유기동물 정보를 자동으로 가져와 DB에 저장 (동기화)
  2. 사용자가 동물 목록을 검색·필터링하여 관심 동물을 찾고, 상세 정보 확인
  3. 입양 또는 임시보호를 신청하면 보호소 관리자가 승인/거절 처리
  4. 각 단계마다 자동 이메일/인앱 알림 발송

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️ PART 1: 동물정보 — 공공API 연동
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1-A. 전체 아키텍처 & 데이터 흐름

외부 API → 우리 서버 → DB → 사용자 브라우저의 3단계:

```
공공데이터포털 API (data.go.kr)
       ↓ HTTP GET (JSON)
PublicApiService (API 클라이언트)
       ↓ List<AnimalItem>
AnimalSyncService (동기화 로직 — upsert/삭제)
       ↓ Animal Entity
AnimalRepository (JPA) → PostgreSQL animals 테이블
       ↓ 조회
AnimalService → AnimalController (REST API)
       ↓ JSON Response
React 프론트엔드 (AnimalsPage, AnimalDetailPage)
```

### 1-B. 공공API 클라이언트 — PublicApiService.java

- **역할**: 공공데이터포털의 REST API를 호출하여 JSON 응답을 Java 객체로 변환
- **API 엔드포인트**: `https://apis.data.go.kr/1543061/abandonmentPublicService_v2`
- **인증 방식**: 서비스키(ServiceKey)를 쿼리 파라미터로 전달, application.yml의 `public-api.service-key`에서 읽음
- **주요 메서드**:
  | 메서드 | 설명 |
  |--------|------|
  | `getAbandonedAnimals(uprCd, orgCd, upkind, state, bgnde, endde, pageNo, numOfRows)` | 유기동물 목록 조회. 시도/시군구/축종/상태/기간으로 필터 가능 |
  | `parseAnimalItems(json)` | JSON 응답 → `List<AnimalItem>` 변환. 단일 객체/배열 분기 처리 |
  | `getShelters(uprCd, orgCd)` | 보호소 목록 조회 |
  | `getKindList(upkind)` | 품종코드 → 품종명 매핑 조회 (417000=개, 422400=고양이) |
  | `isApiKeyConfigured()` | API 키 설정 여부 확인 |
- **핵심 포인트**: 
  - 공공 API 응답 구조: `{ "response": { "body": { "items": { "item": [...] } } } }` → 중첩이 깊어서 `PublicApiResponse` 래퍼 클래스로 파싱
  - 단일 결과(1건)일 때 item이 배열이 아닌 객체로 오는 문제 → parseAnimalItems에서 분기 처리

### 1-C. 공공API 응답 DTO — AnimalItem.java

공공API가 반환하는 유기동물 1건의 필드를 그대로 매핑한 DTO:

| 필드 | 타입 | API 필드명 | 설명 |
|------|------|-----------|------|
| desertionNo | String | desertionNo | 유기번호 (고유 식별자) |
| popfile1 / popfile2 | String | popfile1, popfile2 | 동물 이미지 URL |
| happenDt | String | happenDt | 접수일 |
| happenPlace | String | happenPlace | 발견장소 |
| kindCd | String | kindCd | 품종코드 |
| kindNm | String | kindNm | 품종명 (믹스견 등) |
| upKindCd | String | upKindCd | 축종코드 (417000=개, 422400=고양이) |
| age | String | age | 나이 (예: "2022(년생)") |
| weight | String | weight | 체중 |
| processState | String | processState | 상태 (보호중, 입양 등) |
| sexCd | String | sexCd | 성별 (M, F, Q) |
| neuterYn | String | neuterYn | 중성화 여부 (Y, N, U) |
| specialMark | String | specialMark | 특징 |
| careNm / careTel / careAddr | String | careNm 등 | 보호소명/전화/주소 |
| orgNm / chargeNm / officetel | String | orgNm 등 | 관할기관/담당자/연락처 |

→ `@JsonProperty`와 `@JsonAlias`로 다양한 필드명 변형에 대응 (API 버전별로 대소문자가 다를 수 있음)

### 1-D. 공공API 응답 래퍼 — PublicApiResponse.java

JSON 중첩 구조를 표현하는 래퍼:
```java
PublicApiResponse
  └── ResponseWrapper response
       ├── HeaderWrapper header (resultCode, resultMsg)
       └── BodyWrapper body
            ├── ItemsWrapper items
            │    └── Object item  // 단일 객체 또는 배열!
            └── Integer totalCount
```
→ `item` 필드가 Object 타입인 이유: 공공API가 결과가 1건이면 객체, 여러 건이면 배열로 반환하므로 유연하게 처리

### 1-E. 동기화 로직 — AnimalSyncService.java (핵심!)

공공API 데이터를 DB에 동기화하는 핵심 서비스. 약 500줄의 가장 복잡한 파일.

- **핵심 메서드**:
  | 메서드 | 설명 |
  |--------|------|
  | `syncFromPublicApi(days, maxPages, speciesFilter)` | N일치 변경분 증분 동기화 (메인 진입점) |
  | `syncDailySchedule()` | 스케줄러용: 최근 7일 + 전체 상태 조회 + 비보호 동물 삭제 |
  | `syncByUpkind(upkind, startDate, endDate, maxPages)` | 축종(개/고양이)별 페이지 순회 동기화 |
  | `upsertAnimal(AnimalItem item)` | 핵심! 1건씩 신규등록 or 기존수정 or 보호종료삭제 판단 |
  | `createAnimalFromApi(item)` | API 데이터 → Animal Entity 생성 |
  | `updateAnimalFromApi(animal, item)` | 기존 Animal의 모든 필드 최신화 |
  | `findOrCreateShelter(item)` | 보호소 없으면 자동 생성 |
  | `mapSpecies(item)` | 축종코드 → Species enum (DOG/CAT) |
  | `extractBreed(item)` | 품종명 추출 (kindNm > kindFullNm 파싱 > kindCd 매핑) |
  | `mapGender(sexCd)` | M→MALE, F→FEMALE |
  | `mapStatus(processState)` | "보호중"→PROTECTED, "입양"→null(삭제대상) |
  | `parseAge(age)` | "2022(년생)" → 나이 계산 |
  | `parseWeight(weight)` | "12.5(Kg)" → BigDecimal |
  | `estimateSize(weight)` | 무게 기반 크기 추정 (SMALL/MEDIUM/LARGE) |
  | `generateName(item)` | 품종+번호 조합으로 이름 자동 생성 |
  | `resolveImageUrl(item)` | popfile1 > popfile2 > popfile > filename 순서로 이미지 URL 결정 |
  | `removeNonProtectedFromApi(days)` | DB에서 비보호 상태 동물 제거 (경량 정리) |

- **Upsert(Update or Insert) 패턴**:
  ```
  desertionNo(유기번호)로 DB 검색
    → 없으면: 신규 Animal 생성 → DB INSERT (ADDED)
    → 있으면:
       (1) 입양·안락사·반환 상태면 → DB DELETE (REMOVED)
       (2) 보호 중이면 → 모든 필드 UPDATE (UPDATED)
  ```

- **SyncResult**: 동기화 결과를 담는 record — `addedCount`, `updatedCount`, `removedCount`

- **품종 코드 매핑**: 동기화 시작 시 `ensureKindMapLoaded()`로 품종코드→품종명 맵을 1회 로드하여 `ConcurrentHashMap`에 캐싱

### 1-F. Animal Entity — Animal.java

DB의 `animals` 테이블과 매핑되는 JPA Entity:

| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long (PK, AUTO) | 내부 고유 ID |
| shelter | Shelter (ManyToOne) | 보호소 (필수) |
| publicApiAnimalId | String(50) | 공공API 유기번호 (desertionNo) |
| orgName | String(100) | 관할기관 |
| chargeName / chargePhone | String | 담당자 / 담당자 연락처 |
| species | Species (Enum) | DOG / CAT |
| breed | String(50) | 품종 |
| name | String(50) | 이름 (자동 생성) |
| age | Integer | 나이(세) |
| gender | Gender (Enum) | MALE / FEMALE |
| size | Size (Enum) | SMALL / MEDIUM / LARGE |
| weight | BigDecimal | 체중(kg) |
| description | String (TEXT) | 설명 (발견장소 + 특징) |
| imageUrl | String(500) | 대표 이미지 URL |
| neutered / vaccinated | Boolean | 중성화 / 예방접종 여부 |
| status | AnimalStatus (Enum) | PROTECTED / ADOPTED / FOSTERING |
| registerDate | LocalDate | 등록일 |
| createdAt / updatedAt | Instant | 자동 타임스탬프 |
| images | List<AnimalImage> | 추가 이미지 (1:N) |

→ 인덱스: species, status, shelter_id, public_api_animal_id

### 1-G. 동물 조회 — AnimalService.java & AnimalController.java

**AnimalController 엔드포인트** (`/api/animals`):
| HTTP Method | 경로 | 설명 | 특이사항 |
|---|---|---|---|
| GET | `/api/animals` | 동물 목록 조회 | 종류·크기·지역·검색어 필터, 랜덤/정렬 지원 |
| GET | `/api/animals/{id}` | 동물 상세 조회 | |
| GET | `/api/animals/recommendations` | 선호도 기반 추천 | 인증 필요, 사용자 선호도 기반 |
| POST | `/api/animals` | 동물 등록 | 관리자/보호소 |
| PUT | `/api/animals/{id}` | 동물 수정 | 관리자/보호소 |
| DELETE | `/api/animals/{id}` | 동물 삭제 | 관리자/보호소 |

**AnimalService 주요 메서드**:
- `findAll(species, status, size, region, sigungu, search, pageable)` → 다중 필터 조건 동적 쿼리
- `findAllRandom(...)` → 동일 필터 + 랜덤 정렬 (많은 동물이 골고루 노출)
- `findById(id)` → 상세 조회
- `findRecommended(userId, pageable)` → 사용자 선호도(종류·나이·크기·지역) 기반 맞춤 조회
- `syncFromPublicApiWithStatus(days, maxPages, speciesFilter)` → 동기화 위임
- `cleanupInvalidStatus()` → ADOPTED/NULL 상태 동물 일괄 삭제
- `toResponse(Animal)` → Entity → AnimalResponse DTO 변환 (보호소 정보 포함)

### 1-H. 관리자 동기화 API — AdminAnimalController.java

**엔드포인트** (`/api/admin/animals`):
| HTTP Method | 경로 | 설명 |
|---|---|---|
| POST | `/sync-from-public-api` | 수동 동기화 (days, maxPages, species 파라미터) |
| DELETE | `/cleanup-invalid` | 동기화 + 비보호 동물 일괄 정리 |
| GET | `/sync-history` | 동기화 이력 조회 (자동/수동, 건수, 에러 메시지) |

→ 동기화 실행 시 `SyncHistoryService`에 이력 기록 (triggerType: AUTO/MANUAL)

### 1-I. 스케줄 동기화 — PublicApiSyncScheduler.java

- `@ConditionalOnProperty(name = "public-api.sync-enabled", havingValue = "true")` → 설정으로 활성화/비활성화
- `@Scheduled(cron = "${public-api.sync-cron:0 0 2 * * *}")` → 매일 새벽 2시 자동 실행
- 최근 7일 변경분을 동기화 + 비보호 상태 동물 자동 삭제

### 1-J. 프론트엔드 — 동물 목록/상세 페이지

#### animal.ts (API 모듈)
```typescript
animalApi.getAll(params)   // GET /animals → 목록 + 필터
animalApi.getById(id)      // GET /animals/:id → 상세
animalApi.create(data)     // POST /animals → 등록 (관리자)
```

#### AnimalsPage.tsx (동물 목록 페이지)
- 뷰 모드: "전체" / "나를 위한 추천"
- 필터: 종류(개/고양이), 크기(소/중/대), 시/도, 시/군/구
- 검색: 이름·품종·보호소 검색 (debounce 400ms)
- 페이징: 8/12/20 건 선택
- 하트(찜) 버튼: loggedIn 시 즐겨찾기 토글
- 선호도 모달: PreferenceModal로 선호도 설정/변경
- 카드: 이미지, 이름, 종류·나이·크기·성별, 품종·중성화 여부, 보호소명 표시

#### AnimalDetailPage.tsx (동물 상세 페이지)
- 동물 정보: 이미지(클릭 확대), 이름, 종류, 품종, 나이, 성별, 크기, 중성화, 상태, 설명
- 보호소 정보: 보호소명, 관할기관, 담당자, 주소, 전화번호
- **유기번호 활용**: 전화 문의 시 보호소가 동물을 식별할 수 있도록 유기번호 표시 + "예시 문구 복사" 기능
- 카카오맵: 보호소 위치 표시 + 길찾기 링크
- CTA 버튼: "입양 절차 안내" → GuideAdoptionPage, "임보 절차 안내" → GuideFosterPage
- → **이 지점에서 PART 2(입양/임시보호)로 자연스럽게 연결**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 PART 2: 입양/임시보호 기능
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 2-A. 아키텍처 & 데이터 흐름

```
사용자 브라우저 → [adoption.ts API 모듈] → HTTP POST/GET/PUT
  → [AdoptionController] → [AdoptionService] → [AdoptionRepository (JPA)]
  → PostgreSQL adoptions 테이블
  → EmailService (이메일) + NotificationService (인앱 알림) 연동
```

### 2-B. Entity — Adoption.java

JPA Entity. DB의 `adoptions` 테이블과 매핑:
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

인덱스: user_id, animal_id, status
@PrePersist / @PreUpdate 로 타임스탬프 자동 설정

### 2-C. Enum

```java
public enum AdoptionType {
    ADOPTION,   // 입양
    FOSTERING   // 임시보호
}

public enum AdoptionStatus {
    PENDING,    // 대기
    APPROVED,   // 승인
    REJECTED,   // 거절
    CANCELLED   // 취소
}
```
→ 상태 전이: PENDING → APPROVED | REJECTED | CANCELLED (PENDING 상태에서만 변경 가능)

### 2-D. Controller — AdoptionController.java

기본 경로: `/api/adoptions`, Swagger 태그: "Adoption"

| HTTP Method | 경로 | 설명 | 권한 |
|---|---|---|---|
| POST | `/api/adoptions` | 입양/임보 신청 | 인증 사용자 |
| GET | `/api/adoptions/shelter/pending` | 보호소 대기 신청 목록 | 보호소 관리자 |
| GET | `/api/adoptions/my` | 내 신청 목록 | 인증 사용자 |
| PUT | `/api/adoptions/{id}/cancel` | 신청 취소 | 본인 |
| PUT | `/api/adoptions/{id}/approve` | 신청 승인 | 관리자 |
| PUT | `/api/adoptions/{id}/reject` | 신청 거절 | 관리자 |

인증: HttpServletRequest의 `userId` attribute에서 JWT 인증 사용자 ID 추출
응답 래퍼: `ApiResponse<T>` (status, message, data, timestamp)

### 2-E. Service — AdoptionService.java (핵심 비즈니스 로직)

- **apply(신청)**: User·Animal 조회 → Adoption 엔티티 빌드·저장 → 신청자에게 접수 이메일 → 관리자에게 인앱 알림 + 이메일
- **cancel(취소)**: 본인 확인 + PENDING 상태 확인 → CANCELLED
- **approve(승인)**: PENDING 확인 → APPROVED, processedAt 기록 → 신청자에게 승인 이메일
- **reject(거절)**: PENDING 확인 → REJECTED, rejectReason·processedAt 기록 → 신청자에게 거절 이메일
- **getPendingByShelter**: 보호소별 대기 신청 페이징 조회
- **getPendingByShelterForCurrentUser**: 현재 로그인 관리자의 보호소 자동 식별
- **getAllForAdmin**: 시스템 관리자 전체 목록
- **getMyList**: 사용자 본인 신청 내역
- **toResponse**: Entity → DTO 변환 (applicantName, animalName 포함)
- **notifyAndEmailAdmin**: 보호소 관리자에게 알림·이메일 자동 발송

### 2-F. Repository — AdoptionRepository.java

- JpaRepository 상속
- 쿼리 메서드:
  - `findAllByOrderByCreatedAtDesc` — 전체 최신순
  - `findByUser_IdOrderByCreatedAtDesc` — 사용자별
  - `findByAnimal_Id` — 동물별
  - `findByAnimal_Shelter_IdAndStatusOrderByCreatedAtDesc` — 보호소별·상태별
  - `countByUser_IdAndStatus` — 사용자·상태별 건수

### 2-G. DTO

- **AdoptionRequest**: animalId(필수), type(필수), reason, experience, livingEnv, familyAgreement(필수)
- **AdoptionResponse**: id, userId, animalId, applicantName, animalName, type, status, reason, experience, livingEnv, createdAt

### 2-H. 연동 서비스

**EmailService** (Resend API):
- `sendApplicationReceivedEmail` — 신청자에게 접수 확인
- `sendApplicationReceivedToAdmin` — 관리자에게 새 신청 알림
- `sendApprovalEmail` — 승인 알림
- `sendRejectionEmail` — 거절 알림 + 사유

**NotificationService** (인앱 알림):
- DB 저장, 타입: "ADOPTION_APPLICATION"

### 2-I. 프론트엔드 (React + TypeScript)

#### adoption.ts (API 모듈)
| 함수 | HTTP | 설명 |
|------|------|------|
| apply(data) | POST /adoptions | 신청 |
| getMyList(page, size) | GET /adoptions/my | 내 목록 |
| cancel(id) | PATCH /adoptions/{id}/cancel | 취소 |
| getByAnimalId(id) | GET /adoptions/animal/{id} | 동물별 조회 |
| getPendingByShelter(page, size) | GET /adoptions/shelter/pending | 보호소 대기 |
| approve(id) | PUT /adoptions/{id}/approve | 승인 |
| reject(id, reason) | PUT /adoptions/{id}/reject | 거절 |

#### GuideAdoptionPage.tsx (입양 절차 안내)
- 6단계 안내: 필수교육 → 대기동물 확인 → 상담 예약 → 동물 만남 → 계약·확정 → 사후 관리
- animalId 쿼리 파라미터로 특정 동물 정보 로드 가능
- GuideCallBlock 컴포넌트로 보호소 전화 연결 지원

#### GuideFosterPage.tsx (임시보호 절차 안내)
- 4단계 안내: 신청서 작성 → 가정환경 점검 → 계약서 작성 → 동물 인수
- 파란색 테마 (입양은 녹색)

#### GuideCallBlock.tsx (공용 전화 연결 컴포넌트)
- 동물의 유기번호(publicApiAnimalId), 보호소명, 담당자 전화번호 표시
- "예시 문구 복사" 기능 (클립보드)
- 입양=녹색(green), 임보=파란색(blue) 스타일 분기

#### 프론트엔드 사용처
| 페이지 | 설명 |
|--------|------|
| AnimalsPage.tsx | 동물 목록 (필터·검색·찜) |
| AnimalDetailPage.tsx | 동물 상세 → 입양/임보 신청 버튼 |
| GuideAdoptionPage.tsx | 입양 안내 페이지 |
| GuideFosterPage.tsx | 임보 안내 페이지 |
| MyPage.tsx | 내 입양 신청 내역 표시 |
| AdminDashboardPage.tsx | 관리자용 대기 신청 승인/거절 |
| AdoptableSection.tsx | 랜딩 페이지 입양 가능 동물 섹션 |

━━━━━━━━━━━━━━━━━━━━
🔄 핵심 프로세스 다이어그램
━━━━━━━━━━━━━━━━━━━━

**[PART 1] 공공API → DB 동기화 프로세스:**
1. 스케줄러(매일 새벽 2시) 또는 관리자 수동 호출
2. PublicApiService.getAbandonedAnimals() → 공공API HTTP GET
3. JSON 파싱 → List<AnimalItem>
4. 각 AnimalItem → upsertAnimal():
   - desertionNo로 DB 검색
   - 없으면 → CREATE (Animal + Shelter 자동 생성)
   - 있으면 + 보호중 → UPDATE (모든 필드)
   - 있으면 + 입양/안락사/반환 → DELETE
5. SyncResult(added, updated, removed) 반환 → SyncHistory에 기록

**[PART 2] 입양/임시보호 신청 프로세스:**
1. 사용자가 동물 상세 페이지에서 "입양 신청" 또는 "임보 신청" 클릭
2. 프론트엔드 → POST /api/adoptions (type: ADOPTION 또는 FOSTERING)
3. AdoptionService.apply():
   a) User, Animal 조회 (없으면 404)
   b) Adoption 엔티티 생성 (status=PENDING)
   c) DB 저장
   d) 신청자에게 접수 확인 이메일 발송
   e) 보호소 관리자에게 인앱 알림 + 이메일 발송
4. 응답 반환 (AdoptionResponse)

**관리자 승인/거절 프로세스:**
1. 관리자가 관리 페이지에서 대기 신청 목록 조회 (GET /api/adoptions/shelter/pending)
2. 승인: PUT /api/adoptions/{id}/approve → status=APPROVED, processedAt 기록, 승인 이메일
3. 거절: PUT /api/adoptions/{id}/reject → status=REJECTED, rejectReason·processedAt 기록, 거절 이메일

**상태 전이도:**
```
[PENDING] ──승인──→ [APPROVED]
[PENDING] ──거절──→ [REJECTED]
[PENDING] ──취소──→ [CANCELLED]
(PENDING 이외 상태에서는 변경 불가)
```

━━━━━━━━━━━━━━━━━━━━
📝 슬라이드 구성 가이드
━━━━━━━━━━━━━━━━━━━━

아래 구성을 권장합니다. 필요 시 조정하세요:

**PART 1: 동물정보 — 공공API 연동 (슬라이드 1~15)**

1. **타이틀 슬라이드** — 62댕냥 동물정보 & 입양 기능 완전 정복
2. **프로젝트 소개** — 62댕냥이란? 전체 기술 스택 소개
3. **"외부 API"란?** — 비유: 다른 도서관에서 책을 빌려오는 것. 공공데이터포털 소개
4. **공공API 연동 전체 그림** — data.go.kr → 우리 서버 → DB → 사용자 화면 흐름도
5. **공공API 호출 — PublicApiService** — HTTP GET으로 데이터 요청, ServiceKey 인증, JSON 응답
6. **API 응답 파싱의 함정** — 단일 객체 vs 배열 문제, 중첩 JSON 구조, PublicApiResponse 래퍼
7. **공공API 데이터 매핑 — AnimalItem** — 공공API 필드 → Java 객체 변환, @JsonProperty 역할
8. **동기화의 핵심 — AnimalSyncService (1)** — Upsert 패턴: 신규등록 vs 수정 vs 삭제 판단
9. **동기화의 핵심 — AnimalSyncService (2)** — 데이터 변환: 나이파싱, 체중→크기, 품종추출, 이름생성
10. **DB에 저장 — Animal Entity** — Entity·테이블 구조, Shelter 관계, 인덱스
11. **스케줄 자동 동기화** — @Scheduled, CRON 표현식, @ConditionalOnProperty
12. **동물 조회 API** — AnimalController 엔드포인트, 필터·페이징·검색·랜덤정렬
13. **선호도 기반 추천** — 사용자 선호도 설정 → 맞춤 동물 추천
14. **프론트엔드 — 동물 목록 페이지** — AnimalsPage 필터·검색·카드·찜 기능
15. **프론트엔드 — 동물 상세 페이지** — AnimalDetailPage 정보·보호소·카카오맵·유기번호 활용

**PART 2: 입양/임시보호 (슬라이드 16~30)**

16. **PART 2 도입** — 동물 상세 → "입양 신청" 클릭! 이 다음에 무슨 일이?
17. **입양/임시보호란?** — 입양 vs 임시보호 개념 비교 (일상적 비유)
18. **통합 설계의 지혜** — AdoptionType enum으로 하나의 테이블로 통합한 이유
19. **데이터 모델** — Adoption Entity의 필드와 관계 (User, Animal과의 연관)
20. **상태 머신** — AdoptionStatus 상태 전이도 (비유: 택배 주문 상태와 유사)
21. **API 설계** — REST 엔드포인트 목록 표
22. **신청 프로세스 (사용자 관점)** — 사용자가 신청하는 전체 흐름
23. **신청 프로세스 (코드 관점)** — AdoptionService.apply() 로직 단계별 설명
24. **관리자 승인/거절 프로세스** — approve(), reject() 로직
25. **알림 시스템 연동** — 이메일(Resend) + 인앱 알림 발송 흐름
26. **프론트엔드 — API 모듈 & 타입** — adoption.ts의 axios 호출 구조, TypeScript 타입
27. **프론트엔드 — 입양/임보 가이드 페이지** — GuideAdoptionPage 6단계 + GuideFosterPage 4단계
28. **프론트엔드 — GuideCallBlock** — 공용 전화연결 컴포넌트 재사용, 유기번호 연동
29. **전체 시퀀스 다이어그램** — 공공API 동기화 → 사용자 조회 → 입양 신청 → 승인까지 전체 시퀀스
30. **검증 & 에러 핸들링** — @Valid, CustomException, 상태 체크, API 키 미설정 대응
31. **두 파트의 연결 — 전체 아키텍처 복습** — 공공API → Animal → Adoption까지 End-to-End
32. **실무 설계 포인트 총정리** — 오늘 배운 설계 결정들 요약
33. **Q&A** — 질문 시간

━━━━━━━━━━━━━━━━━━━━
⚠️ 추가 지시사항
━━━━━━━━━━━━━━━━━━━━

- 각 슬라이드의 **시각 자료 제안**에는 "시퀀스 다이어그램", "ER 다이어그램", "상태 전이도", "코드 스니펫 하이라이트", "화면 목업", "비교 표", "흐름도(Flow Chart)" 등 구체적인 종류를 명시하세요.
- 대본에서는 **비유**를 적극 사용하세요. 예시:
  - 공공API 연동: "다른 도서관에서 책 목록을 빌려와 우리 도서관 서가에 꽂아두는 것"
  - Entity: "서류 양식"
  - Repository: "서류 보관함"  
  - Service: "담당 직원"
  - Controller: "안내 데스크"
  - Upsert: "택배가 왔을 때 — 새 물건이면 진열, 기존 물건이면 업데이트, 품절이면 치우기"
  - 상태 전이: "택배 상태 추적 — 접수 → 배송중 → 배송완료"
  - 스케줄러: "매일 아침 자동으로 신문이 배달되는 것과 같은 원리"
- 코드를 보여줄 때는 전체 코드가 아닌 **핵심 라인 3~5줄만** 발췌하여 설명하세요.
- PART 1에서 **외부 API 연동의 현실적 어려움** (응답 형식 불일치, 단일/배열 분기, 서비스 키 인코딩 등)을 강조하세요.
- PART 2에서 입양과 임시보호가 같은 코드(Adoption Entity, AdoptionType enum)로 통합된 설계 결정을 강조하세요.
- **두 파트의 연결고리**: 동물 상세 페이지(AnimalDetailPage)의 "입양 신청" 버튼이 PART 1의 동물 데이터와 PART 2의 입양 기능을 자연스럽게 이어주는 지점임을 강조하세요.
- 상태 관리(PENDING → APPROVED/REJECTED/CANCELLED)가 왜 중요한지, 실무에서 "이미 처리된 건을 다시 처리하면 안 되는 이유"를 일상 비유로 설명하세요.
- 대본에서 **청중에게 질문 던지기** 스타일을 활용하세요. 예: "여러분, 공공API에서 데이터가 1건만 올 때와 여러 건이 올 때 형식이 달라진다면 어떻게 하시겠어요?"
```

---

> **TIP**: 이 프롬프트를 AI에 전달한 뒤, 원하는 슬라이드 수·시간·대상을 조정하거나, 특정 슬라이드를 더 상세히 해달라고 후속 요청하면 됩니다.

> **참고**: 슬라이드 수나 강의 시간이 부담된다면, PART 1(동물정보/API)과 PART 2(입양)를 별도 세션으로 나눠서 각 30분 강의로 진행할 수도 있습니다.

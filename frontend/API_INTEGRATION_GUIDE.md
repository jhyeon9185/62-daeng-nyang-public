# 백엔드 API 연동 가이드

## 📦 구현 완료 사항

클래스 다이어그램(`DN_project_class-diagram_260128.md`)에 기반하여 다음 기능들이 구현되었습니다:

### 1. 타입 시스템 (`src/types/`)
- `entities.ts`: 백엔드 Entity 타입 정의
- `dto.ts`: Request/Response DTO 타입 정의

### 2. API 모듈 (`src/api/`)
- `animal.ts`: 동물 목록/상세 조회
- `adoption.ts`: 입양/임보 신청, 내 신청 목록, 취소
- `volunteer.ts`: 봉사 모집공고 조회, 봉사 신청
- `donation.ts`: 물품 기부 요청 조회, 기부 신청
- `board.ts`: 게시판 목록/상세/작성, 댓글 작성

### 3. 페이지 (`src/pages/`)

#### 입양 (`/animals`)
- **AnimalsPage**: 동물 목록 + 필터링 (종류, 크기, 상태)
- **AnimalDetailPage**: 동물 상세 정보 + 입양/임보 신청 모달

#### 봉사 (`/volunteers`)
- **VolunteersPage**: 봉사 모집공고 목록 + 신청 모달

#### 기부 (`/donations`)
- **DonationsPage**: 물품 기부 요청 목록 + 진행률 표시 + 기부 신청 모달

#### 게시판 (`/boards`)
- **BoardsPage**: 게시글 목록 + 타입별 필터 (공지/FAQ/자유/후기)
- **BoardDetailPage**: 게시글 상세 + 댓글 목록/작성
- **BoardWritePage**: 게시글 작성

---

## 🔧 백엔드 연동 설정

### 1. 환경 변수 설정

`.env` 파일 생성 (`.env.example` 복사):

\`\`\`bash
cp .env.example .env
\`\`\`

`.env` 파일 수정:

\`\`\`env
VITE_API_BASE_URL=http://localhost:8080/api
# 카카오 지도 (동물 상세페이지 보호소 위치): [developers.kakao.com](https://developers.kakao.com) 앱 생성 후 JavaScript 키 발급
VITE_MAP_API_KEY=발급받은_카카오_JavaScript_키
\`\`\`

- **VITE_MAP_API_KEY**: 동물 상세페이지에서 보호소 위치를 카카오 지도로 표시할 때 사용. 미설정 시 "지도 API 키가 설정되지 않았습니다." 메시지가 표시됨.
- **카카오 지도 개발 환경 설정**: 카카오 API는 등록된 도메인에서만 동작합니다. **localhost 개발용 도메인 등록** 및 키 설정은 **[\`docs/KAKAO_MAP_DEV_SETUP.md\`](../docs/KAKAO_MAP_DEV_SETUP.md)** 에서 순서대로 확인하세요. (JavaScript 키 발급 → 사이트 도메인에 \`http://localhost:5173\` 등록 → \`VITE_MAP_API_KEY\` 설정 → \`npm run dev\` 후 접속)

### 2. 백엔드 API 엔드포인트 규격

프론트엔드는 다음 엔드포인트를 기대합니다:

#### Animals
- `GET /api/animals?species=DOG&size=SMALL&status=PROTECTED&page=0&pageSize=12`
- `GET /api/animals/{id}` — 상세 조회 시 보호소 정보 포함: `shelterName`, `shelterAddress`, `shelterPhone`, `shelterLatitude`, `shelterLongitude` (지도·전화·카카오맵 링크용)
- **보호소 정보 출처**: 공공 API(유기동물 조회)의 `careNm`(이름), `careTel`(전화), `careAddr`(주소)를 보호소로 저장. 위·경도는 API에 없어 주소만 있으면 카카오 지도 Geocoder로 좌표 변환 후 표시. 상세페이지에는 보호소명·주소·전화·지도·「카카오맵에서 보기」·「길찾기」(위경도 있을 때) 노출.

#### Adoptions
- `POST /api/adoptions` (body: AdoptionRequest)
- `GET /api/adoptions/my?page=0&size=10`
- `PATCH /api/adoptions/{id}/cancel`
- `GET /api/adoptions/animal/{animalId}`

#### Volunteers
- `GET /api/volunteers/recruitments?page=0&size=10`
- `GET /api/volunteers/recruitments/{id}`
- `POST /api/volunteers` (body: VolunteerApplyRequest)
- `GET /api/volunteers/my?page=0&size=10`

#### Donations
- `GET /api/donations/requests?page=0&size=10`
- `GET /api/donations/requests/{id}`
- `POST /api/donations` (body: DonationApplyRequest)
- `GET /api/donations/my?page=0&size=10`

#### Boards
- `GET /api/boards?type=FREE&page=0&size=15`
- `GET /api/boards/{id}`
- `POST /api/boards` (body: BoardCreateRequest)
- `POST /api/boards/{id}/comments` (body: CommentCreateRequest)
- `GET /api/boards/{id}/comments`

### 3. 응답 형식

모든 API 응답은 다음 형식을 따릅니다:

\`\`\`typescript
{
  "status": 200,
  "message": "성공",
  "data": { /* 실제 데이터 */ },
  "timestamp": "2026-01-30T12:00:00"
}
\`\`\`

페이지네이션 응답:

\`\`\`typescript
{
  "status": 200,
  "message": "성공",
  "data": {
    "content": [ /* 데이터 배열 */ ],
    "page": 0,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10
  },
  "timestamp": "2026-01-30T12:00:00"
}
\`\`\`

### 4. 인증 처리

- JWT 토큰은 `localStorage`에 저장됩니다.
- 모든 요청 헤더에 자동으로 `Authorization: Bearer {token}` 추가
- 401 응답 시 자동으로 refresh token으로 갱신 시도
- refresh 실패 시 자동 로그아웃 및 로그인 페이지 이동

---

## 🚀 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

백엔드 서버가 `localhost:8080`에서 실행 중이어야 합니다.

---

## 📝 추후 구현 필요 사항

1. **인증 페이지** (`/login`, `/signup`)
2. **마이페이지** (내 신청 목록 조회)
3. **관리자 페이지** (신청 승인/거절)
4. **이미지 업로드** 기능
5. **검색** 기능
6. **좋아요/북마크** 기능

---

## 🐛 디버깅 팁

### CORS 에러 발생 시

백엔드 Spring Boot에서 CORS 설정 필요:

\`\`\`java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
\`\`\`

### API 요청 확인

브라우저 개발자 도구 > Network 탭에서 요청/응답 확인 가능합니다.

---

## 📚 참고 문서

- 클래스 다이어그램: `DN_project_class-diagram_260128.md`
- 타입 정의: `src/types/entities.ts`, `src/types/dto.ts`
- API 모듈: `src/api/`

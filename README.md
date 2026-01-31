# DN Platform - 62댕냥이 매칭 플랫폼

유기동물 입양/임시보호 매칭, 봉사활동 및 물품 후원 신청 플랫폼

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- TailwindCSS (스타일링)
- React Query (서버 상태 관리)
- Zustand (클라이언트 상태 관리)
- Axios (HTTP 클라이언트)

### Backend
- Java 21
- Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA
- MySQL 8.0

### External Services
- 공공데이터 API (유기동물/보호소 정보)
- Resend (이메일 발송)
- Map API (지도)

## 입양 파트와 쇼핑몰 구조 참조

- **입양(동물 목록·상세·신청)** 은 쇼핑몰 구조에서 일정 부분을 차용합니다 (썸네일 카드, 상세 페이지, “주문” → “입양 신청”).
- **백엔드**: 프로젝트 루트의 `스프링부트_Gemini.md` (Spring Boot 쇼핑몰) 아키텍처를 참조합니다. Item → Animal, ItemImg → AnimalImage, Order → Adoption 등으로 도메인만 매핑하여 적용.
- **프론트엔드**: 책/문서는 Thymeleaf 기준이지만, **본 프로젝트는 React**로 구현합니다.
- 상세 매핑표와 기능 대응은 [docs/입양_쇼핑몰_구조_매핑.md](docs/입양_쇼핑몰_구조_매핑.md)를 참고하세요.

## 프로젝트 구조

```
DN_project01/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── api/          # API 통신 모듈
│   │   ├── components/   # 재사용 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── store/        # Zustand 스토어
│   │   ├── types/        # TypeScript 타입
│   │   └── utils/        # 유틸리티 함수
│   └── ...
│
├── backend/               # Spring Boot 백엔드
│   └── src/main/java/com/dnproject/platform/
│       ├── config/       # 설정 클래스
│       ├── security/     # 보안 (JWT)
│       ├── domain/       # Entity 클래스
│       ├── repository/   # JPA Repository
│       ├── service/      # 비즈니스 로직
│       ├── controller/   # REST Controller
│       ├── dto/          # DTO 클래스
│       ├── exception/    # 예외 처리
│       └── constant/     # 상수, Enum
│
├── docs/                  # 문서
│   ├── API_SPEC.md       # API 명세서
│   ├── 입양_쇼핑몰_구조_매핑.md  # 입양↔쇼핑몰 도메인·기능 매핑 (백엔드=문서 참조, 프론트=React)
│   └── schema.sql        # MySQL DDL
│
└── .claude/skills/        # Claude Code Skills
```

## 시작하기

### 요구사항
- Node.js 18+
- Java 21
- MySQL 8.0
- Docker (선택)

### 환경 설정

1. **데이터베이스 설정 (MySQL 8.0)**

   **방법 A: Docker Compose (권장)**
   ```bash
   # 프로젝트 루트(DN_project01)에서
   docker compose up -d

   # 접속 정보 (기본값)
   # - 호스트: localhost:3306
   # - DB: dn_platform
   # - root 비밀번호: root
   # - 전용 유저: dn / dn
   ```

   **방법 B: 단일 컨테이너**
   ```bash
   docker run --name dn-mysql \
     -e MYSQL_ROOT_PASSWORD=root \
     -e MYSQL_DATABASE=dn_platform \
     -e MYSQL_CHARACTER_SET_SERVER=utf8mb4 \
     -p 3306:3306 -d mysql:8.0
   ```

   **테이블 생성**
   - 개발 환경(`application-dev.yml`)에서는 `spring.jpa.hibernate.ddl-auto: update`로 **자동 생성**됩니다.
   - 수동 DDL이 필요하면 `docs/schema.sql`을 MySQL에 실행하세요.

2. **Backend 실행**
   ```bash
   # 프로젝트 루트(DN_project01)에서 - backend/.env 자동 로드
   ./scripts/run-backend-dev.sh
   ```
   (또는 `cd backend` 후 `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`. DB 비밀번호는 `backend/.env` 또는 `DB_PASSWORD` 환경 변수로 설정.)

3. **Frontend 실행**
   ```bash
   cd frontend
   cp .env.example .env   # 최초 1회, 필요 시 VITE_API_BASE_URL 확인
   npm install
   npm run dev
   ```

4. **연동 확인 (로그인·회원가입부터)**  
   백엔드와 프론트를 둘 다 켠 뒤, 회원가입 → 로그인 → 마이페이지 → 동물 목록 순으로 확인하려면 **[docs/INTEGRATION_CHECK.md](docs/INTEGRATION_CHECK.md)** 를 참고하세요.

### 환경 변수

**Backend (application-dev.yml 또는 환경변수)**
```
DB_USERNAME=root          # Docker 사용 시 root 또는 dn
DB_PASSWORD=root          # Docker Compose 기본값은 root
JWT_SECRET=your-256-bit-base64-encoded-secret
RESEND_API_KEY=re_xxxxxxxx
PUBLIC_API_SERVICE_KEY=your-public-api-key
```

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_MAP_API_KEY=your-map-api-key
```

## 주요 기능

### 일반 사용자
- 유기동물 조회 및 검색
- 입양/임시보호 신청
- 봉사활동 신청
- 물품 후원 신청
- 커뮤니티 게시판

### 보호소 관리자
- 동물 수동 등록 (공공API 미제공 시)
- 봉사 모집공고 등록
- 물품 후원 요청 등록
- 신청 승인/거절 처리

### 시스템 관리자
- 회원 관리
- 보호소 인증 관리
- 전체 게시판 관리

## API 문서

- Swagger UI: http://localhost:8080/swagger-ui.html
- API 명세서: [docs/API_SPEC.md](docs/API_SPEC.md)

## 개발 가이드

### Claude Code Skills
이 프로젝트는 `.claude/skills/` 폴더에 개발 가이드를 포함하고 있습니다:

- `feature-planner.md` - 기능 개발 계획 수립
- `react-component.md` - React 컴포넌트 생성
- `spring-entity.md` - JPA Entity 생성
- `spring-api.md` - REST API 생성
- `spring-security.md` - 보안 설정
- `api-module.md` - Frontend API 모듈
- `zustand-store.md` - 상태 관리
- `database-schema.md` - 데이터베이스 스키마
- `email-service.md` - 이메일 서비스
- `public-api.md` - 공공데이터 API 연동
- `typescript-types.md` - TypeScript 타입 정의

## 라이선스

MIT License

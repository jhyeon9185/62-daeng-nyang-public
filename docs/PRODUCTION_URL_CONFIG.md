# 프로덕션 URL 설정 가이드

프로덕션 배포 시 URL이 하드코딩된 부분들과 GitHub Secrets 설정을 정리합니다.

---

## 1. GitHub Secrets에서 설정하는 URL

| Secret | 용도 | 예시 값 |
|--------|------|---------|
| **FRONTEND_URL** | CORS, 이메일 "관리자 로그인 바로가기" 링크. 구글 OAuth 원본과 동일해야 함 | `http://13.125.175.126.nip.io` |
| **VITE_API_BASE_URL** | (빌드 시 자동 설정됨 - workflow에서 `/api` 고정) | - |

---

## 2. URL이 사용되는 위치

### Resend 이메일 (보호소 관리자 알림)
- **위치**: `EmailService.sendApplicationReceivedToAdmin()`
- **환경변수**: `app.frontend-url` (= FRONTEND_URL)
- **용도**: "관리자 로그인 바로가기" 버튼 링크 → `{FRONTEND_URL}/admin/login`
- **설정**: GitHub Secrets `FRONTEND_URL` → 배포 시 `--app.frontend-url`로 전달

### CORS (교차 출처 요청)
- **위치**: `CorsConfig`, `application.yml`
- **환경변수**: `cors.allowed-origins`
- **용도**: 다른 도메인에서 API 호출 시 허용 출처
- **설정**: `http://localhost:5173,http://localhost:3000,{FRONTEND_URL}` (배포 시 자동 병합)

### 프론트엔드 API 호출
- **위치**: `frontend/src/lib/axios.ts`
- **환경변수**: `VITE_API_BASE_URL` (빌드 시 주입)
- **용도**: 백엔드 API 베이스 URL
- **설정**: GitHub Actions에서 `VITE_API_BASE_URL=/api`로 빌드 (같은 호스트 상대 경로)

---

## 3. 현재 프로덕션 URL (nip.io)

구글 OAuth는 **IP 주소를 승인된 JavaScript 원본으로 등록할 수 없어** nip.io 사용:

- **접속/프론트 URL**: `http://13.125.175.126.nip.io`
- **GitHub Secret `FRONTEND_URL`**: `http://13.125.175.126.nip.io` (끝에 슬래시 없이)
- **Google 콘솔** → 승인된 JavaScript 원본: `http://13.125.175.126.nip.io` 추가
- **승인된 리디렉션 URI**: 등록 불필요 (ID 토큰 팝업 방식)

다른 도메인으로 변경 시:

1. **GitHub Secrets** → `FRONTEND_URL` 값을 새 URL로 수정
2. **재배포**: `git push` 또는 `./deploy.sh`
3. 이메일 링크와 CORS가 새 URL로 자동 반영

---

## 4. 체크리스트

- [ ] GitHub Secrets `FRONTEND_URL` = `http://13.125.175.126.nip.io`
- [ ] Google 콘솔 승인된 JavaScript 원본에 `http://13.125.175.126.nip.io` 등록
- [ ] 배포 후 `http://13.125.175.126.nip.io` 접속 → 구글 로그인 동작 확인

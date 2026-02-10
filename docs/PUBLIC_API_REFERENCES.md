# 공공데이터 구조동물 API 실제 사용 사례 및 500 오류 해결

## 1. GitHub 프로젝트 (실제 API 사용)

| 프로젝트 | URL | 비고 |
|----------|-----|------|
| **dwg787/TeamApple** | https://github.com/dwg787/TeamApple | api.js 에 실제 API 호출 코드 |
| ToyPJ-MC/abandoned-pets-fe | https://github.com/toypj-mc/abandoned-pets-fe | 공공 API 이용 유기동물 서비스 |
| smosco/BEFPEF | https://github.com/smosco/BEFPEF | befpef.netlify.app 운영 |

## 2. URL 테스트 결과 (curl 기준)

| Base | 경로 | 결과 |
|------|------|------|
| 1543061 | abandonmentPublicService_v2/getAbandonmentPublicList | **404** API not found |
| 1543061 | abandonmentPublicSrvc/abandonmentPublic | **500** Unexpected errors |
| 15098931 | abandonmentPublicService_v2/getAbandonmentPublicList | **500** Unexpected errors |
| 15098931 | abandonmentPublicSrvc/abandonmentPublic | **500** Unexpected errors |

→ 500 = 서버는 찾았으나 오류. 404 = 경로 없음.

## 3. 500 "Unexpected errors" 가능 원인 (구글링)

### 3.1 인증키 인코딩
- **GET URL 쿼리** → **Encoding 키** 사용 (%, %2F, %3D 등으로 이미 인코딩된 형태)
- **POST body / params 딕셔너리** → **Decoding 키** 사용, 라이브러리가 URL 인코딩
- 마이페이지에서 **일반 인증키(Encoding)** 과 **(Decoding)** 둘 다 확인
- Decoding 키에 `+`, `/`, `=` 포함 시 URL에 그대로 넣으면 500 가능 → **Encoding 키** 사용 권장

### 3.2 활용신청 API 확인
- **15098931** (구조동물조회) 와 **15098915** (동물보호센터) 는 별도 API
- 15098931 구조동물조회에 대한 활용신청·승인 여부 확인

### 3.3 Swagger에서 직접 테스트
1. [data.go.kr](https://www.data.go.kr) 로그인
2. [구조동물조회 15098931](https://www.data.go.kr/data/15098931/openapi.do) → **활용명세** → Open API 실행
3. Swagger UI에서 본인 인증키로 직접 호출해 정상/오류 확인

### 3.4 기타
- **TLS 1.2**: 일부 환경에서 TLS 1.3 사용 시 500 가능 → TLS 1.2 강제 시도
- **빈 파라미터**: `upr_cd=`, `org_cd=` 등 빈 값 제거 후 재시도

## 4. 문의처

| 구분 | 연락처 |
|------|--------|
| 동식물빅데이터팀 | 054-912-0379 |
| 공공데이터 문제해결 | 1566-0025, opendata_help@nia.or.kr |

## 5. 현재 코드 적용

- Base: `15098931` (1543061 → 404)
- 경로: `abandonmentPublicSrvc/abandonmentPublic`
- serviceKey: `.env`의 DATA_API_KEY (Encoding 키 권장)

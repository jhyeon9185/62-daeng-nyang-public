# 공공데이터포털 API 연동 가이드

프로젝트 루트의 **data_go_kr.md**에 신청한 API 정보·엔드포인트·인증키 요약이 정리되어 있습니다.  
백엔드는 해당 엔드포인트와 **Encoding** 인증키로 연동합니다.

- **데이터를 끌어오는 방식**:  
  - **수동**: 관리자가 API(`POST /api/admin/animals/sync-from-public-api`)를 호출할 때마다 1회 수집.  
  - **자동(스케줄)**: 설정으로 **하루 1회**(기본 새벽 2시) 자동 수집 가능. (일 10,000건 한도 있으므로 하루 1회 권장.)

## 1. 사용 API (data_go_kr.md 기준)

- **구조동물 조회**: 국가동물보호정보시스템 구조동물 조회 서비스  
  - End Point: `https://apis.data.go.kr/1543061/abandonmentPublicService_v2`  
  - 활용: 유기동물 목록 → DB 동기화
- **동물보호센터 정보**: 동물보호센터 정보 조회서비스  
  - End Point: `https://apis.data.go.kr/1543061/animalShelterSrvc_v2`  
  - 활용: 보호소 목록 조회 (선택)

### 제공 기능

| API | 용도 |
|-----|------|
| 유기동물 조회 | 전국 구조·유기동물 목록 (보호중/공고중) |
| 보호소 조회 | 시도/시군구별 보호소 목록 |

---

## 2. API 키 발급

1. [공공데이터포털](https://www.data.go.kr) 회원가입/로그인
2. [국가동물보호정보시스템 구조동물조회서비스](https://www.data.go.kr/data/15098931/openapi.do) 페이지에서 **활용신청**
3. 승인 후 **마이페이지 → 인증키**에서 **일반 인증키(Encoding)** 복사
4. 백엔드 설정에 적용 (아래 3절)

---

## 3. 백엔드 설정 (API 연동 가능 조건)

### 1) backend/.env (권장)

인증키를 **backend/.env**에 두면, `scripts/run-backend-dev.sh`로 실행 시 자동으로 로드됩니다.

```env
# 공공데이터 API (Encoding 키)
DATA_API_KEY=발급받은_인증키
```

`application.yml`에서 `public-api.service-key`는 `${DATA_API_KEY}`를 우선 사용합니다.

### 2) 환경 변수

백엔드를 다른 방식으로 실행할 때는 다음 중 하나를 설정하면 됩니다.

```bash
export DATA_API_KEY="발급받은_인증키"
# 또는
export PUBLIC_API_SERVICE_KEY="발급받은_인증키"
```

### 3) application.yml

```yaml
public-api:
  service-key: ${DATA_API_KEY:${PUBLIC_API_SERVICE_KEY:your-public-api-service-key}}
```

**DATA_API_KEY**(또는 PUBLIC_API_SERVICE_KEY)가 설정되어 있으면 **API 연동 가능**합니다.  
키가 없으면 동기화 API는 빈 목록을 반환하고, 수동 등록·기존 DB 데이터는 그대로 사용 가능합니다.

---

## 4. 연동 확인

1. **backend/.env**에 `DATA_API_KEY=발급받은_인증키` 설정 (data_go_kr.md에 적어둔 Encoding 키 사용).
2. 백엔드를 **`./scripts/run-backend-dev.sh`** 로 실행해 .env가 로드되도록 함.
3. 관리자 계정으로 로그인 후 `POST /api/admin/animals/sync-from-public-api?days=7&maxPages=1` 호출.
4. 응답에 `syncedCount`가 0보다 크거나, 동물 목록 API에서 데이터가 보이면 연동 성공.

**한 번에 확인하는 스크립트** (백엔드 실행 후):

```bash
# 1) 백엔드 실행 (다른 터미널에서)
./scripts/run-backend-dev.sh

# 2) 확인 스크립트 실행 (DN_project01 루트에서)
./scripts/verify-public-api.sh
```

스크립트는 테스트용 관리자 계정 생성 → 로그인 → 동기화 API 호출 → 동물 목록 조회까지 자동으로 수행합니다.

동기화 시 404/빈 목록이면 공공데이터포털 해당 API의 **활용명세(Swagger)** 에서 실제 경로·파라미터를 확인하세요.

---

## 5. 동기화 방식 · 하루에 몇 번 끌어오는지

### 5-1. 현재 동작

- **수동 동기화**: 관리자가 `POST /api/admin/animals/sync-from-public-api` 를 호출할 때만 공공데이터를 가져옵니다.
- **자동(스케줄) 동기화**: 설정으로 **하루 1회**(예: 새벽 2시) 자동 실행할 수 있습니다. (아래 5-2 참고)

### 5-2. 하루에 몇 번 끌어오는 게 좋은지

- **공공데이터포털 제한**: 개발계정 **일 10,000건** 호출 한도가 있으므로, 무제한으로 자주 호출하면 안 됩니다.
- **권장**: **하루 1번** (예: 새벽 2시) 에 최근 7일치만 조회하는 방식이 일반적입니다.
  - 새로 구조·공고된 동물은 그날 안에 반영되고, 트래픽도 적게 씁니다.
- **더 자주** 하려면: 1일 2~3회까지는 한도 내에서 가능하지만, `days`·`maxPages`를 작게 두어 호출 건수를 줄이는 것이 좋습니다.
- **스케줄 끄기**: 자동 동기화가 필요 없으면 설정에서 비활성화할 수 있습니다.

### 5-3. 스케줄 동기화 설정 (하루 1회 자동 수집)

자동으로 **하루 1번** 공공데이터를 끌어오게 하려면 아래 설정을 켜면 됩니다.

**application.yml** (또는 application-prod.yml):

```yaml
public-api:
  service-key: ${DATA_API_KEY:...}
  sync-enabled: true                    # 스케줄 동기화 사용
  sync-cron: "0 0 17 * * *"             # 매일 한국시간 새벽 2시 (UTC 17시, 기본값)
```

**환경 변수**로만 제어하려면:

```bash
# 스케줄 켜기 + 매일 한국시간 새벽 2시
export PUBLIC_API_SYNC_ENABLED=true
export PUBLIC_API_SYNC_CRON="0 0 17 * * *"  # UTC 17시 = KST 02시
```

**cron 표현식** (초 분 시 일 월 요일, **서버는 UTC 시간대 사용**):

| 예시 | 의미 |
|------|------|
| `0 0 17 * * *` | 매일 UTC 17:00 (한국시간 새벽 02:00) - 기본값 |
| `0 0 2 * * *` | 매일 UTC 02:00 (한국시간 오전 11:00) |
| `0 0 */6 * * *` | 매일 00:00, 06:00, 12:00, 18:00 UTC (하루 4회, 트래픽 주의) |

- **sync-enabled**를 넣지 않거나 `false`면 스케줄은 동작하지 않고, **수동 호출**만 가능합니다.
- 스케줄이 돌 때는 **최근 7일치**, **전체 종(개+고양이)** 기준으로 동기화합니다. (days·species 변경은 코드/설정 확장 시 가능)

### 5-4. 흐름

1. **수동**: 관리자가 `POST /api/admin/animals/sync-from-public-api` 호출  
   **또는** **스케줄**: 설정한 시간(예: 매일 02:00)에 백엔드가 자동으로 동일 로직 실행
2. 백엔드가 공공 API에 **유기동물 목록** 요청 (보호중, 최근 N일)
3. 응답을 파싱해 **보호소**는 이름 기준으로 찾거나 생성, **동물**은 `public_api_animal_id`(유기번호) 기준으로 **등록 또는 갱신**

### 동기화 API

| Method | URL | 권한 | 설명 |
|--------|-----|------|------|
| POST | `/api/admin/animals/sync-from-public-api` | SUPER_ADMIN, SHELTER_ADMIN | 공공 API → DB 동기화 |

**Query 파라미터**

| 파라미터 | 기본값 | 설명 |
|----------|--------|------|
| days | 7 | 최근 N일 데이터만 조회 |
| maxPages | (없음) | 최대 페이지 수 (테스트 시 작게 지정) |
| species | (없음) | DOG / CAT / 비우면 전체 |

**예시**

```bash
# 최근 7일, 전체 종 (개+고양이)
curl -X POST "http://localhost:8080/api/admin/animals/sync-from-public-api?days=7" \
  -H "Authorization: Bearer {관리자_토큰}"

# 최근 30일, 개만, 최대 3페이지
curl -X POST "http://localhost:8080/api/admin/animals/sync-from-public-api?days=30&species=DOG&maxPages=3" \
  -H "Authorization: Bearer {관리자_토큰}"
```

**응답 예시**

```json
{
  "status": 200,
  "message": "동기화 완료",
  "data": {
    "syncedCount": 42,
    "days": 7,
    "species": "ALL"
  }
}
```

---

## 6. 데이터 매핑 (공공 API → DB)

| 공공 API 필드 | DB (animals) |
|---------------|----------------|
| desertionNo | public_api_animal_id |
| kindCd | species, breed (파싱) |
| happenDt | register_date |
| sexCd | gender (M/F) |
| weight | weight, size (추정) |
| specialMark | description |
| neuterYn | neutered |
| popfile / filename | image_url |
| processState | status (보호중/입양/임보) |
| careNm, careAddr, careTel | 보호소 찾기/생성 후 shelter_id |

보호소는 **이름(careNm)** 으로 조회하고, 없으면 **새 보호소 생성** (manager_name="공공API", verification_status=APPROVED).  
**지역 필터**: `careAddr`를 파싱해 Shelter의 `region_sido`/`region_sigungu`에 저장하고, 입양 목록 API에서 이 컬럼으로 필터링. (선택) 보호소 API `shelterInfo_v2`의 `upr_cd`/`org_cd`로 시도·시군구별 보호소 목록을 가져와 매칭하는 방식으로 확장 가능.

---

## 7. 동기화 동작 방식

### 7-1. 증분 동기화 (Incremental Sync)
API의 `bgnde`/`endde` 파라미터는 **변경일(수정일) 기준**으로 필터링합니다.
- **1일 조회 시**: 어제~오늘 사이에 **신규 등록되거나 상태가 변경된** 동물만 반환
- **변경 없는 기존 동물**: API 응답에 없음 → DB에서 건드리지 않음
- **별도 상태 동기화 불필요**: 상태가 바뀐 동물은 변경일 필터에 자동 포함됨
- **만료 보정**: 등록일 30일 초과 + 보호중 → ADOPTED(추정)

### 7-2. Upsert 로직
- **기준 키**: `publicApiAnimalId` (= API의 `desertionNo`)
- **동일 데이터**: desertionNo가 DB에 있으면 → **덮어쓰기** (이미지, 상태, 설명 등 갱신)
- **새 데이터**: desertionNo가 없으면 → **추가**
- 삭제는 하지 않음 (API에 없는 동물은 DB에 그대로 유지)

### 7-3. 건수 기준
- **목록 건수(예: 861)**: DB에 저장된 입양대상(보호중+임시보호) 동물 전체
- **동기화 N마리**: 해당 실행에서 API 응답을 처리(추가/갱신)한 건수
- **syncedCount**: 이번 실행에서 upsert한 건 (신규 + 변경분 모두 포함)
- **statusCorrectedCount**: 30일 초과로 ADOPTED 추정 처리한 건수

### 7-4. 오래된 동물 상태 보정
- API는 `bgnde`~`endde` 기간 내 **변경된** 동물만 반환 (변경일 기준)
- **변경 없는 오래된 동물**: API 응답에 포함되지 않음 → 동기화 시 **건드리지 않음** (정상)
- **상태 보정**: 등록일(register_date)이 **30일 초과**된 공공API 유래 보호중 동물은 동기화 시 **ADOPTED(추정)** 로 자동 변경
- 이로써 "계속 쌓여만 가는" 보호중 목록을 정리. 입양 게시판에는 PROTECTED만 노출되므로 자연스럽게 제외됨

---

## 8. 주의사항

- **트래픽**: 개발계정 10,000건/일. 스케줄은 **하루 1회** 권장, 더 자주 쓰면 `days`·`maxPages`로 호출량을 줄이세요.
- **인코딩**: 공공데이터 인증키는 **Encoding** 키 사용 (Decoding 아님).
- **스케줄**: `public-api.sync-enabled=true` 로 두면 `PublicApiSyncScheduler`가 매일 `sync-cron` 시간에 자동 동기화합니다. (`@EnableScheduling`은 이미 적용됨)

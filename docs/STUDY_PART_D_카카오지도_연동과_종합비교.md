# Spring Boot + React REST API 연동 스터디 — 파트 D: 카카오지도 연동과 종합 비교

> **프로젝트**: 62댕냥이 (유기동물 입양/임보 매칭 플랫폼)
> **기술 스택**: Spring Boot 3.2 + Java 21 / React 18 + TypeScript + Vite
> **작성 기준**: 실제 프로젝트 코드 (`DN_project01`)
> **선행 학습**: [파트 C: 외부 API 연동](./STUDY_PART_C_외부_API_연동.md) — WebClient, 데이터 동기화, 스케줄링

---

## 관련 문서 바로가기

| 문서 | 설명 |
|------|------|
| [파트 A: REST API 기반구조](./STUDY_PART_A_REST_API_기반구조.md) | CORS, Security, JWT, ApiResponse |
| [파트 B: 실전 API 개발](./STUDY_PART_B_실전_API_개발.md) | RESTful 설계, Entity→DTO→Controller |
| [파트 C: 외부 API 연동](./STUDY_PART_C_외부_API_연동.md) | 공공데이터 API, WebClient, 동기화 |
| [파트 E: Terraform 인프라](./STUDY_PART_E_Terraform_인프라_생성.md) | AWS 인프라 코드(IaC) |
| [파트 F: CI/CD와 환경변수](./STUDY_PART_F_CICD와_환경변수.md) | GitHub Actions, 배포 자동화 |
| [파트 G: 안정화와 트러블슈팅](./STUDY_PART_G_안정화와_트러블슈팅.md) | 운영 중 문제 해결 |
| [카카오맵 설정 가이드](./KAKAO_MAP_DEV_SETUP.md) | 카카오 개발자 콘솔 설정, 도메인 등록 |
| [DB 스키마](./DATABASE.md) | shelters 테이블 (위도/경도 컬럼) |

---

## 이 문서를 읽기 전에: 파트 C와 파트 D의 관계

파트 C에서는 **백엔드가 외부 API를 호출**하는 패턴을 배웠다 (공공데이터포털). 파트 D에서는 **프론트엔드가 외부 API를 호출**하는 패턴을 배운다 (카카오지도). 같은 "외부 API 연동"인데 왜 호출 주체가 다른지, 어떤 기준으로 결정하는지가 이 문서의 핵심이다.

```
파트 C (백엔드 호출):   [우리 백엔드] ──→ [공공데이터포털]  (서버→서버, API 키 숨김)
파트 D (프론트 호출):   [사용자 브라우저] ──→ [카카오 서버]   (브라우저→서버, 도메인 인증)
```

> **소스코드 바로가기** (이 문서에서 다루는 핵심 파일들)
>
> | 분류 | 파일 | 경로 |
> |------|------|------|
> | 지도 컴포넌트 | `KakaoMap.tsx` | [`frontend/src/components/map/KakaoMap.tsx`](../frontend/src/components/map/KakaoMap.tsx) |
> | 상세 페이지 | `AnimalDetailPage.tsx` | [`frontend/src/pages/animals/AnimalDetailPage.tsx`](../frontend/src/pages/animals/AnimalDetailPage.tsx) |
> | 보호소 Entity | `Shelter.java` | [`backend/.../domain/Shelter.java`](../backend/src/main/java/com/dnproject/platform/domain/Shelter.java) |
> | 동물 응답 DTO | `AnimalResponse.java` | [`backend/.../dto/response/AnimalResponse.java`](../backend/src/main/java/com/dnproject/platform/dto/response/AnimalResponse.java) |
> | Service 변환 | `AnimalService.java` | [`backend/.../service/AnimalService.java`](../backend/src/main/java/com/dnproject/platform/service/AnimalService.java) |
> | CORS 설정 | `CorsConfig.java` | [`backend/.../config/CorsConfig.java`](../backend/src/main/java/com/dnproject/platform/config/CorsConfig.java) |
> | Axios 설정 | `axios.ts` | [`frontend/src/lib/axios.ts`](../frontend/src/lib/axios.ts) |
> | 프론트 엔티티 타입 | `entities.ts` | [`frontend/src/types/entities.ts`](../frontend/src/types/entities.ts) |

---

## 목차

| 장 | 제목 | 핵심 키워드 | 관련 소스코드 |
|---|------|------------|-------------|
| [7장](#7장-카카오지도-api--백엔드-vs-프론트엔드-역할-분담) | 카카오지도 API — 백엔드 vs 프론트엔드 역할 분담 | JavaScript SDK, 도메인 기반 인증, 좌표 전달 | Shelter.java, AnimalResponse.java |
| [8장](#8장-프론트엔드-카카오지도-구현-백엔드-관점에서-이해) | 프론트엔드 카카오지도 구현 (백엔드 관점에서 이해) | KakaoMap.tsx, Geocoding, 마커 | KakaoMap.tsx, AnimalDetailPage.tsx |
| [9장](#9장-두-가지-외부-api-패턴-비교) | 두 가지 외부 API 패턴 비교 | 백엔드 호출 vs 프론트 호출, 판단 기준 | 전체 아키텍처 |
| [10장](#10장-종합-아키텍처-정리) | 종합 아키텍처 정리 | 3가지 API 연결, 전체 데이터 흐름도 | 모든 파일 |
| [11장](#11장-실전-트러블슈팅-모음) | 실전 트러블슈팅 모음 | API 키 인코딩, 타임아웃, CORS, JWT 만료 | CorsConfig.java, axios.ts |

---

# 7장. 카카오지도 API — 백엔드 vs 프론트엔드 역할 분담

> **이 장에서 배우는 것**: 같은 "외부 API"인데 왜 카카오지도는 프론트엔드에서 호출하는지, 백엔드와 프론트엔드가 각각 어떤 역할을 맡는지 이해한다.
>
> **관련 소스코드**:
> [`Shelter.java`](../backend/src/main/java/com/dnproject/platform/domain/Shelter.java) ·
> [`AnimalResponse.java`](../backend/src/main/java/com/dnproject/platform/dto/response/AnimalResponse.java) ·
> [`AnimalService.java`](../backend/src/main/java/com/dnproject/platform/service/AnimalService.java) ·
> [`KakaoMap.tsx`](../frontend/src/components/map/KakaoMap.tsx)

> 💡 **초보자를 위한 비유**: 파트 C는 **도서관 사서(백엔드)가 다른 도서관에 전화해서 책을 주문**하는 것이었다. 파트 D는 **방문자(브라우저)가 직접 벽에 걸린 지도를 보는** 것이다. 사서가 지도를 대신 볼 수 없듯이, 지도 UI는 브라우저에서만 그릴 수 있다.

## Why — 왜 카카오지도는 프론트엔드에서 호출하는가

파트 C에서 공공데이터포털 API는 **백엔드(Spring Boot)**가 호출했다. 그런데 카카오지도는 **프론트엔드(React)**가 직접 호출한다. 왜 다를까?

### 이유 1: 지도 UI는 브라우저에서만 그릴 수 있다

```
공공데이터 API → 데이터(JSON)를 반환 → 서버에서 처리 가능
카카오지도 SDK → 지도(UI)를 렌더링 → 브라우저 DOM 조작 필요 → 서버에서 불가능
```

카카오지도 SDK는 `<div>` 태그 안에 지도를 그린다. 이건 브라우저의 DOM(Document Object Model)에 접근해야만 가능한 작업이다. Spring Boot 서버에는 브라우저가 없으므로 지도를 그릴 수 없다.

### 이유 2: JavaScript SDK가 클라이언트 전용이다

카카오에서 제공하는 SDK는 **JavaScript 라이브러리**로, 브라우저의 `<script>` 태그로 로드해서 사용한다:

```html
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=키&libraries=services"></script>
```

이 SDK는 `window.kakao.maps` 전역 객체를 생성하고, 이를 통해 지도를 생성하고 마커를 표시한다. Node.js나 Java에서는 사용할 수 없는, **브라우저 전용 SDK**다.

### 이유 3: API 키 인증이 도메인 기반이다

| API | 인증 방식 | 키 저장 위치 | 키 노출 |
|-----|----------|------------|--------|
| 공공데이터포털 | 서비스 키 (서버 환경변수) | 백엔드 `.env` | 노출되면 안 됨 |
| 카카오지도 | JavaScript 키 (도메인 제한) | 프론트 `.env` | 브라우저에 노출됨 (정상) |

카카오 JavaScript 키는 **등록된 도메인에서만 동작**하도록 설계되어 있다. 키가 브라우저에 노출되더라도, 카카오 개발자 콘솔에 등록한 도메인(예: `localhost:5173`, `www.example.com`)에서만 API가 응답한다.

```
내 사이트 (localhost:5173) → 카카오 API 호출 → ✅ 등록된 도메인 → 정상 응답
다른 사이트 (evil.com) → 같은 키로 호출 → ❌ 미등록 도메인 → 거부
```

이 구조 덕분에 키가 소스코드에 보여도 **악용이 제한**된다. 공공데이터포털 키는 이런 도메인 제한이 없어서 서버에 숨겨야 한다.

## How — 백엔드와 프론트엔드의 역할

### 백엔드가 하는 일 (Spring Boot)

백엔드는 카카오 API를 직접 호출하지 않는다. 대신 **지도에 표시할 데이터를 준비**해서 프론트에 전달한다.

```
1. 공공데이터 동기화 시 보호소 주소(careAddr) 저장 → Shelter.address
2. Shelter Entity에 위도(latitude), 경도(longitude) 저장
3. AnimalResponse에 shelterAddress, shelterLatitude, shelterLongitude 포함
4. 프론트가 이 데이터를 받아서 카카오지도에 마커 표시
```

**Shelter Entity — 위치 데이터 저장:**

```java
// Shelter.java
@Entity
@Table(name = "shelters")
public class Shelter {

    @Column(nullable = false, length = 255)
    private String address;              // "경기도 수원시 팔달구 ..."

    /** 주소에서 파싱한 시·도 */
    @Column(name = "region_sido", length = 20)
    private String regionSido;           // "경기"

    /** 주소에서 파싱한 시·군·구 */
    @Column(name = "region_sigungu", length = 30)
    private String regionSigungu;        // "수원시 팔달구"

    private BigDecimal latitude;         // 37.2636
    private BigDecimal longitude;        // 127.0286
    // ...
}
```

**AnimalResponse DTO — 프론트에 전달할 지도 데이터:**

```java
// AnimalResponse.java
@Data @Builder
public class AnimalResponse {
    // ... 동물 기본 정보 ...

    private Long shelterId;
    private String shelterName;

    /** 보호소 주소 (상세페이지·지도 표시용) */
    private String shelterAddress;
    /** 보호소 전화번호 */
    private String shelterPhone;
    /** 보호소 위도 (지도 마커용, 없으면 주소로 검색) */
    private Double shelterLatitude;
    /** 보호소 경도 */
    private Double shelterLongitude;
}
```

**AnimalService — Entity → DTO 변환 시 좌표 전달:**

```java
// AnimalService.java — toResponse()
private AnimalResponse toResponse(Animal a) {
    Shelter shelter = a.getShelter();

    // BigDecimal → Double 변환 (JSON 직렬화 시 소수점 표현 위해)
    Double shelterLat = shelter != null && shelter.getLatitude() != null
        ? shelter.getLatitude().doubleValue() : null;
    Double shelterLng = shelter != null && shelter.getLongitude() != null
        ? shelter.getLongitude().doubleValue() : null;

    return AnimalResponse.builder()
            .shelterAddress(shelter != null ? shelter.getAddress() : null)
            .shelterLatitude(shelterLat)
            .shelterLongitude(shelterLng)
            // ... 기타 필드 ...
            .build();
}
```

`BigDecimal` → `Double` 변환을 하는 이유: JPA Entity에서는 정밀도를 위해 `BigDecimal`을 쓰지만, JSON API 응답에서는 `Double`이 더 일반적이고 프론트엔드에서 다루기 쉽다.

### 프론트엔드가 하는 일 (React)

```
1. AnimalResponse에서 shelterAddress, shelterLatitude, shelterLongitude 수신
2. KakaoMap.tsx 컴포넌트에 좌표/주소 전달
3. 카카오 SDK로 지도 렌더링 + 마커 표시
4. 좌표가 없으면 Geocoding(주소→좌표 변환)으로 Fallback
```

### 전체 데이터 흐름

```
[공공데이터포털]                [Spring Boot]                 [React]                  [카카오]
      │                           │                            │                        │
      │ ←── 유기동물+보호소 ──→    │                            │                        │
      │     데이터 동기화          │                            │                        │
      │                    Shelter Entity                       │                        │
      │                    (address, lat, lng)                   │                        │
      │                           │                            │                        │
      │                    AnimalResponse                       │                        │
      │                    (shelterAddress,                      │                        │
      │                     shelterLat, shelterLng)             │                        │
      │                           │ ──── REST API ────→         │                        │
      │                           │                    KakaoMap.tsx                       │
      │                           │                            │ ──── SDK 호출 ────→     │
      │                           │                            │                   지도 렌더링
      │                           │                            │ ←── 지도 타일 ────      │
      │                           │                     마커 표시 + 지도 UI               │
```

## What — 카카오 개발자 설정

### 1단계: 카카오 개발자 사이트 설정

1. [developers.kakao.com](https://developers.kakao.com) 접속 → 로그인
2. "내 애플리케이션" → "애플리케이션 추가하기"
3. 앱 생성 후 → "앱 키" 섹션에서 **JavaScript 키** 복사 (REST API 키 아님!)
4. "플랫폼" → "Web" → "사이트 도메인" 등록:
   - 개발: `http://localhost:5173`
   - 운영: `https://www.your-domain.com`

### 2단계: 프론트엔드 환경 변수

```properties
# frontend/.env.example
VITE_API_BASE_URL=http://localhost:8080/api
# 카카오 지도 (동물 상세페이지 보호소 위치)
# developers.kakao.com 앱 → 플랫폼 키 → JavaScript 키 복사 후,
# 키 설정에서 JavaScript SDK 도메인에 http://localhost:5173 등록
VITE_MAP_API_KEY=발급받은_카카오_JavaScript_키
```

### 카카오 vs 공공데이터 설정 비교

| 항목 | 공공데이터포털 | 카카오지도 |
|------|-------------|-----------|
| 설정 파일 | `backend/.env` | `frontend/.env` |
| 환경 변수 | `DATA_API_KEY` | `VITE_MAP_API_KEY` |
| yml 바인딩 | `public-api.service-key` | 없음 (Vite가 직접 주입) |
| 코드에서 접근 | `@Value("${public-api.service-key}")` | `import.meta.env.VITE_MAP_API_KEY` |
| 키 종류 | Encoding 키 | JavaScript 키 |
| 보안 | 서버에만 존재, 절대 노출 금지 | 브라우저에 노출됨 (도메인 제한으로 보호) |

> 📌 **핵심 정리**
> - 카카오지도는 **프론트엔드에서 직접 호출**한다 (지도 UI 렌더링은 브라우저에서만 가능)
> - 백엔드의 역할은 **좌표 데이터를 준비해서 전달**하는 것 (Shelter → AnimalResponse)
> - 카카오 JavaScript 키는 **도메인 기반 인증**이므로 브라우저에 노출되어도 악용이 제한됨
> - `BigDecimal`(Entity) → `Double`(DTO)로 변환하여 프론트에 전달
> - 카카오 개발자 콘솔에서 **도메인 등록**을 반드시 해야 SDK가 동작함

> ⚠️ **자주 하는 실수**
> - 카카오 **REST API 키**를 사용한다 → 브라우저 SDK에는 **JavaScript 키**를 써야 한다
> - 카카오 개발자 콘솔에 도메인 등록을 안 한다 → SDK 로드 후 "인증 실패" 에러
> - `localhost`와 `localhost:5173`을 혼동한다 → 포트 번호까지 정확히 등록해야 함
> - 백엔드에서 카카오지도를 호출하려 한다 → JavaScript SDK는 브라우저 전용, 서버에서 사용 불가
> - Shelter Entity의 `latitude`/`longitude`가 null인데 확인하지 않는다 → NPE 발생 가능

> 📚 **더 알아보기**
> - Kakao Maps API 문서: `developers.kakao.com/docs/latest/ko/maps/overview`
> - Vite 환경 변수: `VITE_` 접두사가 붙은 변수만 프론트엔드 번들에 포함됨
> - `BigDecimal` vs `Double`: 금융 데이터는 `BigDecimal` 필수, 좌표 정도의 정밀도는 `Double`로 충분

<details>
<summary><strong>✅ 초보자 체크리스트 — 7장 완료 확인</strong></summary>

- [ ] 카카오지도를 프론트엔드에서 호출하는 3가지 이유를 설명할 수 있다 (DOM, SDK, 도메인 인증)
- [ ] 백엔드의 역할이 "좌표 데이터 준비"임을 이해했다
- [ ] `Shelter.java`에서 `latitude`, `longitude` 필드를 찾았다
- [ ] `AnimalResponse.java`에서 `shelterLatitude`, `shelterLongitude` 필드를 찾았다
- [ ] `BigDecimal` → `Double` 변환 이유를 설명할 수 있다
- [ ] 카카오 JavaScript 키와 공공데이터 서비스 키의 보안 차이를 설명할 수 있다
- [ ] 카카오 개발자 콘솔에서 도메인 등록이 필요한 이유를 안다

</details>

---

# 8장. 프론트엔드 카카오지도 구현 (백엔드 관점에서 이해)

> **이 장에서 배우는 것**: KakaoMap.tsx 컴포넌트가 백엔드 데이터를 어떻게 사용하는지 분석하고, 백엔드가 어떤 데이터를 제공해야 하는지 이해한다.
>
> **관련 소스코드**:
> [`KakaoMap.tsx`](../frontend/src/components/map/KakaoMap.tsx) ·
> [`AnimalDetailPage.tsx`](../frontend/src/pages/animals/AnimalDetailPage.tsx) ·
> [`entities.ts`](../frontend/src/types/entities.ts) ·
> [`AnimalResponse.java`](../backend/src/main/java/com/dnproject/platform/dto/response/AnimalResponse.java)

> 💡 **초보자를 위한 비유**: 백엔드는 **택배 기사**이고, 프론트엔드는 **집 인테리어 업자**다. 택배 기사가 "경기도 수원시 37.26, 127.03"이라는 주소와 좌표를 정확히 전달해야, 인테리어 업자가 그 위치에 깃발(마커)을 꽂을 수 있다. 주소도 좌표도 없으면 깃발을 꽂을 곳이 없다.

## Why — 백엔드 개발자가 프론트 코드를 알아야 하는 이유

백엔드가 전달하는 데이터(`shelterAddress`, `shelterLatitude`, `shelterLongitude`)를 프론트엔드가 **어떻게 사용하는지** 알아야, 올바른 형식과 값을 제공할 수 있다.

```
백엔드: "주소와 좌표를 줄게"
프론트: "좌표가 있으면 그걸로 지도에 마커 찍을게. 없으면 주소로 검색할게."
백엔드: "그러면 좌표가 없을 때를 대비해서 주소는 반드시 보내야겠구나."
```

이 대화가 되려면, 백엔드 개발자도 프론트의 지도 로직을 **개괄적으로** 이해해야 한다.

## How — KakaoMap.tsx 컴포넌트 분석

### Props (백엔드가 제공하는 데이터)

```typescript
// KakaoMap.tsx
export interface KakaoMapProps {
  /** 보호소 주소 (위경도 없을 때 주소 검색으로 표시) */
  address?: string | null;
  /** 위도 (있으면 주소 검색 생략) */
  latitude?: number | null;
  /** 경도 */
  longitude?: number | null;
  /** 지도 높이 (px) */
  height?: number | string;
  className?: string;
}
```

| Prop | 백엔드 출처 | 필수? |
|------|------------|-------|
| `address` | `AnimalResponse.shelterAddress` | 좌표가 없을 때 필요 |
| `latitude` | `AnimalResponse.shelterLatitude` | 선택 (있으면 우선 사용) |
| `longitude` | `AnimalResponse.shelterLongitude` | 선택 (있으면 우선 사용) |

**백엔드가 기억할 점**: 좌표(`latitude`, `longitude`)와 주소(`address`) 중 **최소 하나는 반드시** 제공해야 지도가 표시된다.

### SDK 스크립트 로드

```typescript
// KakaoMap.tsx
const KAKAO_SCRIPT_URL = '//dapi.kakao.com/v2/maps/sdk.js';
const APP_KEY = import.meta.env.VITE_MAP_API_KEY;

function loadKakaoScript(): Promise<void> {
  // 이미 로드되었으면 즉시 반환
  if (window.kakao?.maps?.services) return Promise.resolve();

  return new Promise((resolve, reject) => {
    // 이미 script 태그가 있으면 로드 완료 대기
    const existing = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existing) {
      // ... 기존 스크립트 로드 완료 대기 ...
      return;
    }

    // 새 script 태그 생성
    const script = document.createElement('script');
    script.src = `https:${KAKAO_SCRIPT_URL}?appkey=${APP_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      // SDK 로드 후 kakao.maps.load()로 초기화
      const kakao = (window as any).kakao;
      if (kakao.maps.load) {
        kakao.maps.load(() => resolve());
      } else {
        resolve();
      }
    };
    script.onerror = () => reject(new Error('Failed to load Kakao Maps script'));
    document.head.appendChild(script);
  });
}
```

핵심 포인트:
- `autoload=false`: SDK를 수동으로 초기화 (`kakao.maps.load()` 호출 시점 제어)
- `libraries=services`: Geocoder(주소→좌표 변환) 서비스 포함
- **중복 로드 방지**: 이미 로드된 스크립트가 있으면 재사용

### 지도 렌더링 — 좌표 우선, 주소 Fallback

```typescript
// KakaoMap.tsx — useEffect 내부
const hasCoords = latitude != null && longitude != null;

// 좌표도 없고 주소도 없으면 에러 표시
if (!hasCoords && (!address || !address.trim())) {
  setError('표시할 주소가 없습니다.');
  return;
}

loadKakaoScript().then(() => {
  const showMap = (lat: number, lng: number) => {
    const center = new kakao.maps.LatLng(lat, lng);
    const map = new kakao.maps.Map(containerRef.current, {
      center,
      level: 3,    // 줌 레벨 (1=가장 확대, 14=가장 축소)
    });
    const marker = new kakao.maps.Marker({ position: center });
    marker.setMap(map);
  };

  // 전략 1: 좌표가 있으면 바로 지도 표시 (빠름)
  if (hasCoords) {
    showMap(latitude!, longitude!);
    return;
  }

  // 전략 2: 좌표가 없으면 Geocoding으로 주소 → 좌표 변환 (추가 API 호출)
  const geocoder = new kakao.maps.services.Geocoder();
  geocoder.addressSearch(address!.trim(), (result, status) => {
    if (status === kakao.maps.services.Status.OK && result[0]) {
      showMap(parseFloat(result[0].y), parseFloat(result[0].x));
    } else {
      setError('주소를 찾을 수 없습니다.');
    }
  });
});
```

이 로직을 흐름도로 보면:

```
좌표(lat, lng)가 있는가?
  ├── YES → 바로 showMap(lat, lng)  ← 빠름, 추가 API 호출 없음
  │
  └── NO → 주소(address)가 있는가?
        ├── YES → Geocoder.addressSearch(address)
        │           ├── 성공 → showMap(변환된 lat, lng)
        │           └── 실패 → "주소를 찾을 수 없습니다" 에러 표시
        │
        └── NO → "표시할 주소가 없습니다" 에러 표시
```

**백엔드 관점에서의 시사점**:
- **좌표를 같이 보내면** 프론트엔드가 Geocoding API를 호출하지 않아도 된다 → 성능 향상
- **좌표가 없어도 주소만 있으면** 프론트가 알아서 처리한다 → 그래도 동작함
- **둘 다 없으면** 지도를 표시할 수 없다 → 최소한 주소는 보내야 함

### 상세 페이지에서의 사용 — AnimalDetailPage.tsx

```tsx
// AnimalDetailPage.tsx — 보호소 위치 섹션
{(animal.shelterAddress ||
  (animal.shelterLatitude != null && animal.shelterLongitude != null)) && (
  <div className="p-4 pt-0">
    <h3 className="text-sm font-semibold text-gray-700">위치</h3>

    {/* 외부 링크: 카카오맵에서 보기 */}
    {animal.shelterAddress && (
      <a href={`https://map.kakao.com/link/search/${encodeURIComponent(animal.shelterAddress)}`}
         target="_blank" rel="noopener noreferrer">
        카카오맵에서 보기
      </a>
    )}

    {/* 외부 링크: 길찾기 (좌표 필요) */}
    {animal.shelterLatitude != null && animal.shelterLongitude != null && (
      <a href={`https://map.kakao.com/link/to/${encodeURIComponent(animal.shelterName)},${animal.shelterLatitude},${animal.shelterLongitude}`}
         target="_blank" rel="noopener noreferrer">
        길찾기
      </a>
    )}

    {/* 인라인 지도 */}
    <KakaoMap
      address={animal.shelterAddress ?? undefined}
      latitude={animal.shelterLatitude ?? undefined}
      longitude={animal.shelterLongitude ?? undefined}
      height={280}
    />
  </div>
)}
```

3가지 기능이 모두 **백엔드 데이터에 의존**한다:

| 기능 | 필요한 데이터 | URL 패턴 |
|------|-------------|---------|
| 카카오맵에서 보기 | `shelterAddress` | `map.kakao.com/link/search/주소` |
| 길찾기 | `shelterName` + `latitude` + `longitude` | `map.kakao.com/link/to/이름,위도,경도` |
| 인라인 지도 | `address` 또는 `latitude`+`longitude` | SDK로 렌더링 |

### TypeScript 타입 — 프론트엔드 Animal 인터페이스

```typescript
// frontend/src/types/entities.ts
export interface Animal {
  id: number;
  shelterId: number;
  shelterName?: string;
  /** 보호소 주소 (상세페이지·지도 표시용) */
  shelterAddress?: string;
  /** 보호소 전화번호 */
  shelterPhone?: string;
  /** 보호소 위도 (지도 마커용) */
  shelterLatitude?: number;
  /** 보호소 경도 */
  shelterLongitude?: number;
  // ... 기타 필드 ...
}
```

백엔드 `AnimalResponse`의 필드명과 **완전히 동일**하다. 이것이 DTO 설계의 핵심이다:

```
백엔드 AnimalResponse.shelterLatitude (Double)
                    ↓ JSON 직렬화
           "shelterLatitude": 37.2636
                    ↓ TypeScript 타입 체크
프론트 Animal.shelterLatitude (number | undefined)
```

> 📌 **핵심 정리**
> - KakaoMap 컴포넌트는 **좌표 우선, 주소 Fallback** 전략으로 지도를 표시
> - 백엔드가 좌표를 제공하면 프론트의 Geocoding API 호출을 절약할 수 있다
> - 최소한 `shelterAddress` 하나는 보내야 지도가 표시된다
> - TypeScript 인터페이스와 Java DTO의 필드명을 일치시키는 것이 중요
> - 카카오 SDK는 `autoload=false`로 수동 초기화하여 로드 시점을 제어

> ⚠️ **자주 하는 실수**
> - 백엔드에서 `shelterLatitude`를 `String` 타입으로 보낸다 → 프론트에서 `number`로 파싱해야 하는 불필요한 작업 발생
> - 좌표와 주소를 모두 null로 보낸다 → 지도 섹션 자체가 표시되지 않음
> - `BigDecimal`을 JSON으로 보낼 때 문자열로 직렬화된다 → `Double`로 변환 후 전달
> - `encodeURIComponent`를 빼먹는다 → 주소에 특수문자나 한글이 있으면 URL이 깨짐

> 📚 **더 알아보기**
> - Geocoding(주소→좌표): 무료이지만 호출 횟수 제한이 있다. 좌표를 DB에 저장하면 절약 가능
> - 카카오 Link API: `map.kakao.com/link/` 패턴으로 카카오맵 앱/웹을 바로 열 수 있다
> - React `useEffect` cleanup: `cancelled` 플래그로 언마운트 시 상태 업데이트 방지

> 💡 **초보자 핵심 포인트: "좌표 우선, 주소 Fallback" 전략**
>
> ```
> 백엔드가 보내는 데이터         프론트엔드의 동작
> ─────────────────────    ──────────────────────────
> lat=37.26, lng=127.03  → 바로 지도에 마커 (빠름, API 호출 0회)
> address="수원시..."     → Geocoding으로 좌표 변환 후 마커 (느림, API 호출 1회)
> 둘 다 null              → "표시할 주소가 없습니다" 에러
> ```
>
> **결론**: 백엔드가 좌표를 같이 보내면 성능이 좋아진다. 최소한 주소는 보내야 한다.

<details>
<summary><strong>✅ 초보자 체크리스트 — 8장 완료 확인</strong></summary>

- [ ] `KakaoMapProps` 인터페이스에서 `address`, `latitude`, `longitude`의 역할을 안다
- [ ] 좌표 우선 → 주소 Fallback 전략의 흐름도를 이해했다
- [ ] `loadKakaoScript()`의 중복 로드 방지 로직을 이해했다
- [ ] `AnimalDetailPage.tsx`에서 KakaoMap 컴포넌트를 어떻게 사용하는지 확인했다
- [ ] 백엔드 `AnimalResponse`와 프론트 `Animal` 인터페이스의 필드명이 일치하는 이유를 안다
- [ ] `encodeURIComponent`가 왜 필요한지 설명할 수 있다
- [ ] Geocoding API의 호출 횟수 제한을 알고, 좌표를 DB에 저장하는 것이 더 효율적임을 이해했다

</details>

---

# 9장. 두 가지 외부 API 패턴 비교

> **이 장에서 배우는 것**: 백엔드 호출 vs 프론트엔드 호출, 두 가지 외부 API 패턴을 체계적으로 비교하고, 새 API 연동 시 어디에서 호출할지 판단하는 기준을 배운다.
>
> **관련 소스코드**: 파트 C 전체 + 파트 D 전체 (두 패턴의 종합 비교)

> 💡 **초보자를 위한 비유**: 외부 API 호출 위치를 정하는 것은 **물건을 주문하는 방식**과 같다.
> - **백엔드 호출** = 회사 구매팀이 대량으로 주문해서 창고에 쌓아둔다 (공공데이터 동기화)
> - **프론트 호출** = 고객이 매장에서 직접 키오스크를 조작한다 (카카오지도 렌더링)
>
> 어떤 방식이 맞는지는 **보안, 데이터 양, SDK 존재 여부, CORS** 4가지로 판단한다.

## Why — 왜 비교가 중요한가

외부 API를 연동할 때 가장 먼저 결정해야 할 것: **"이 API를 백엔드에서 호출할까, 프론트에서 호출할까?"**

잘못 선택하면:
- 보안 문제: 서버 전용 키가 브라우저에 노출
- 성능 문제: 불필요한 서버 경유로 지연 증가
- 구조 문제: 프론트에서 불가능한 작업을 프론트에 할당

이 프로젝트에는 **두 가지 정반대 패턴**이 공존한다. 비교를 통해 "어떤 기준으로 선택하는가"를 이해하자.

## How — 항목별 상세 비교

### 전체 비교표

| 비교 항목 | 공공데이터포털 API | 카카오지도 API |
|-----------|------------------|---------------|
| **호출 주체** | 백엔드 (Spring WebClient) | 프론트엔드 (JavaScript SDK) |
| **인증 방식** | 서비스 키 (서버 환경변수) | JavaScript 키 (도메인 기반) |
| **인증 키 위치** | `backend/.env` → `@Value` | `frontend/.env` → `import.meta.env` |
| **데이터 흐름** | 외부API → 백엔드 → DB → 프론트 | 백엔드 → 프론트 → 카카오SDK |
| **호출 시점** | 동기화 시 (스케줄/수동) | 사용자가 페이지 볼 때 (실시간) |
| **호출 빈도** | 1일 1회 (또는 수동) | 사용자 접속마다 |
| **응답 데이터** | JSON (동물 목록) | 지도 타일 이미지 + UI |
| **데이터 저장** | DB에 저장 (영구) | 저장 안 함 (매번 렌더링) |
| **보안 고려** | 키 노출 시 무제한 호출 가능 → 서버에 숨김 | 키 노출돼도 도메인 제한 → 프론트 OK |
| **에러 핸들링** | 서버 로그 + SyncHistory DB | 브라우저 콘솔 + UI Fallback |
| **CORS** | 해당 없음 (서버→서버) | 해당 없음 (SDK가 처리) |
| **오프라인 동작** | DB 데이터로 서비스 가능 | 지도 표시 불가 |

### 비교 1: 데이터 흐름

**공공데이터포털 — 백엔드 중심:**

```
[공공데이터포털] ──JSON──→ [Spring Boot] ──DB 저장──→ [MySQL]
                                                        │
                          [Spring Boot] ←── 조회 ────────┘
                               │
                          REST API (JSON)
                               │
                          [React 프론트]
                               │
                          화면에 동물 카드 표시
```

데이터가 **4단계**를 거친다: 외부API → 백엔드 → DB → 프론트. 하지만 사용자가 동물 목록을 볼 때는 **DB에서 바로 조회**하므로 빠르다.

**카카오지도 — 프론트엔드 중심:**

```
[Spring Boot] ──REST API──→ [React 프론트] ──SDK──→ [카카오 서버]
  (좌표 데이터)                 (KakaoMap.tsx)         (지도 타일)
                                    │
                               지도 UI 렌더링
```

백엔드는 **좌표만 전달**하고, 실제 지도 렌더링은 프론트와 카카오 서버 사이에서 일어난다. 백엔드는 지도 API를 전혀 호출하지 않는다.

### 비교 2: 인증 보안 모델

```
공공데이터포털:
  ┌─────────────────────┐
  │     백엔드 서버       │
  │  ┌───────────────┐   │
  │  │ API 키 (서버) │   │ ← 외부에서 접근 불가
  │  └───────────────┘   │
  │  WebClient → 외부 호출 │
  └─────────────────────┘

  키 노출 시: 누구나 API를 무제한 호출 → 과금 또는 차단 위험
  보호 방법: 서버 환경변수로 숨김

카카오지도:
  ┌─────────────────────────┐
  │     브라우저              │
  │  ┌─────────────────┐    │
  │  │ JS 키 (클라이언트)│    │ ← 개발자 도구에서 보임
  │  └─────────────────┘    │
  │  SDK → 카카오 서버 호출   │
  └─────────────────────────┘

  키 노출 시: 등록된 도메인에서만 동작 → 악용 제한
  보호 방법: 카카오 개발자 콘솔에서 도메인 화이트리스트
```

### 비교 3: 에러 핸들링

**공공데이터포털 — 서버 로그 + 이력 DB:**

```java
// 에러 발생 시
try {
    var result = animalSyncService.syncDailySchedule();
    syncHistoryService.save(result, SyncTriggerType.AUTO, null, "ALL", null);
} catch (Exception e) {
    log.error("동기화 실패", e);                    // ← 서버 로그
    syncHistoryService.save(..., e.getMessage());   // ← DB 이력
}
```

관리자가 **서버 로그**와 **동기화 이력 API**로 문제를 추적한다.

**카카오지도 — UI Fallback:**

```typescript
// 에러 발생 시
if (error) {
  return (
    <div className="flex items-center justify-center bg-gray-100 text-gray-500">
      {error}   {/* "지도 API 키가 설정되지 않았습니다." 등 */}
    </div>
  );
}
```

사용자에게 **에러 메시지가 포함된 회색 박스**가 보인다. 치명적이지 않다 — 지도가 안 보여도 동물 정보는 볼 수 있다.

## What — 판단 기준: 어디에서 호출할 것인가

새로운 외부 API를 연동할 때, 다음 4가지 기준으로 판단한다:

### 기준 1: API 키 보안 수준

```
"이 키가 브라우저에 노출되면 얼마나 위험한가?"

위험도 높음 → 백엔드에서 호출
  - 결제 API (Stripe, 토스페이먼츠)
  - 공공데이터포털 (호출 횟수 무제한 가능)
  - SMS 발송 API (비용 발생)
  - AI API (OpenAI, Claude — 과금)

위험도 낮음 → 프론트에서 호출 가능
  - 카카오지도 (도메인 제한)
  - Google Maps (도메인 + HTTP Referer 제한)
  - Firebase (보안 규칙으로 별도 보호)
```

### 기준 2: 데이터 특성

```
"대량 배치 데이터인가, 실시간 UI 데이터인가?"

대량 배치 데이터 → 백엔드에서 호출 + DB 저장
  - 유기동물 수만 건 동기화
  - 날씨 데이터 수집
  - 환율 정보 캐싱

실시간 UI 데이터 → 프론트에서 호출
  - 지도 렌더링
  - 실시간 채팅
  - 소셜 로그인 위젯
```

### 기준 3: 클라이언트 SDK 존재 여부

```
"브라우저 전용 SDK가 있는가?"

SDK 있음 → 프론트에서 호출 (SDK가 최적화되어 있으므로)
  - 카카오지도 JavaScript SDK
  - Google Maps JavaScript API
  - Facebook Login SDK
  - Stripe Elements (결제 UI)

SDK 없음 → 백엔드에서 호출
  - 공공데이터포털 (REST API만 제공)
  - 대부분의 정부/기관 API
```

### 기준 4: CORS 허용 여부

```
"외부 API가 브라우저의 CORS 요청을 허용하는가?"

CORS 허용 (또는 SDK가 처리) → 프론트에서 호출 가능
  - 카카오, Google 등 대형 서비스 SDK

CORS 미허용 → 백엔드에서 호출 (서버간 통신에는 CORS 없음)
  - 대부분의 공공 API
  - 내부 시스템 API
```

### 판단 플로차트

```
새 외부 API를 연동해야 한다
  │
  ├── API 키가 노출되면 위험한가?
  │     ├── YES → 백엔드에서 호출
  │     └── NO ─┐
  │              │
  ├── 브라우저 SDK가 제공되는가?
  │     ├── YES → 프론트에서 호출
  │     └── NO ─┐
  │              │
  ├── CORS를 허용하는가?
  │     ├── YES → 프론트에서 호출 가능 (하지만 보안 재확인)
  │     └── NO → 백엔드에서 호출
  │
  └── 대량 데이터 배치 처리가 필요한가?
        ├── YES → 백엔드에서 호출 + DB 저장
        └── NO → 케이스에 따라 판단
```

> 📌 **핵심 정리**
> - 같은 "외부 API 연동"이라도 **호출 주체**가 다를 수 있다 (백엔드 vs 프론트엔드)
> - 판단 기준 4가지: **키 보안, 데이터 특성, SDK 존재, CORS 허용**
> - 공공데이터포털: 키 보안 중요 + 대량 배치 + SDK 없음 → 백엔드 호출
> - 카카오지도: 도메인 제한 + UI 렌더링 + JS SDK 있음 → 프론트 호출
> - 하나의 프로젝트에 두 패턴이 공존하는 것은 자연스럽다

> ⚠️ **자주 하는 실수**
> - "외부 API는 무조건 백엔드에서 호출해야 한다"고 생각한다 → 케이스에 따라 다르다
> - "프론트에서 호출하면 보안에 문제가 있다"고 단정한다 → 도메인 기반 인증이면 괜찮다
> - 결제 API를 프론트에서 직접 호출한다 → Secret Key 노출로 심각한 보안 사고
> - CORS 문제를 피하려고 백엔드 프록시를 무분별하게 만든다 → SDK가 있으면 프론트에서 직접 사용이 더 효율적

> 📚 **더 알아보기**
> - **BFF 패턴 (Backend For Frontend)**: 프론트별 전용 백엔드를 두어 API 조합을 담당
> - **API Gateway**: 여러 외부 API를 하나의 진입점으로 통합 (Spring Cloud Gateway)
> - **서버 프록시**: CORS 미허용 API를 프론트에서 사용해야 할 때 백엔드가 중계

> 💡 **초보자 핵심 포인트: 판단 기준 4가지 요약**
>
> | 질문 | 백엔드 호출 | 프론트 호출 |
> |------|-----------|-----------|
> | API 키 노출 시 위험한가? | YES → 백엔드 | NO (도메인 제한) |
> | 대량 배치 데이터인가? | YES → 백엔드+DB | NO (실시간 UI) |
> | 브라우저 SDK가 있는가? | 없음 | YES → 프론트 |
> | CORS를 허용하는가? | 미허용 → 백엔드 | 허용 (또는 SDK) |
>
> **이 프로젝트 적용**: 공공데이터(키 위험+대량+SDK없음) → 백엔드 / 카카오지도(도메인제한+UI+SDK있음) → 프론트

<details>
<summary><strong>✅ 초보자 체크리스트 — 9장 완료 확인</strong></summary>

- [ ] 공공데이터포털과 카카오지도의 호출 주체가 다른 이유를 설명할 수 있다
- [ ] 데이터 흐름의 차이를 그림으로 그릴 수 있다 (4단계 vs 3단계)
- [ ] 인증 보안 모델의 차이 (서버 환경변수 vs 도메인 화이트리스트)를 설명할 수 있다
- [ ] 에러 핸들링 방식의 차이 (서버 로그+DB vs 브라우저 콘솔+UI)를 이해했다
- [ ] 판단 기준 4가지 (키 보안, 데이터 특성, SDK, CORS)를 외울 수 있다
- [ ] 판단 플로차트를 따라 새로운 API의 호출 위치를 결정할 수 있다

</details>

---

# 10장. 종합 아키텍처 정리

> **이 장에서 배우는 것**: 프로젝트 전체의 3가지 API 연결을 조감도로 이해하고, 사용자 시나리오별 데이터 흐름을 추적한다. 면접에서 "프로젝트 아키텍처를 설명해주세요"에 답할 수 있게 된다.
>
> **관련 소스코드**: 모든 파일 — 이 장은 전체 프로젝트의 조감도

> 💡 **초보자를 위한 비유**: 이 프로젝트는 **3개의 도로**가 연결된 도시와 같다.
> - **도로 ①** (프론트↔백엔드): 시내 도로 — 주민(사용자)과 시청(백엔드) 사이의 양방향 도로 (JWT 통행증 필요)
> - **도로 ②** (백엔드→공공API): 고속도로 — 시청이 중앙정부에서 데이터를 가져오는 단방향 도로 (서비스 키 필요)
> - **도로 ③** (프론트→카카오): 전용 터널 — 주민이 직접 지도 서비스에 접속하는 단방향 도로 (동네 주민만 통과 가능)

## Why — 전체 그림을 보는 것이 중요하다

개별 파일과 클래스를 이해했으면, 이제 **전체 시스템이 어떻게 연결되는지** 조감도를 그려야 한다. 면접이나 기술 설명 시 "프로젝트 아키텍처를 설명해 주세요"라는 질문에 답할 수 있어야 한다.

## How — 전체 데이터 흐름도

### 3가지 API 연결

이 프로젝트에는 **3가지 종류의 API 연결**이 있다:

```
                    ① REST API + JWT
[React 프론트엔드]  ←─────────────────────→  [Spring Boot 백엔드]
  (localhost:5173)    Axios Interceptor         (localhost:8080)
       │                                              │
       │                                              │ ② WebClient + 서비스 키
       │                                              │
       │ ③ JavaScript SDK                             ▼
       │   + 도메인 키                          [공공데이터포털]
       │                                    (apis.data.go.kr)
       ▼
  [카카오지도 서버]
  (dapi.kakao.com)
```

| 번호 | 연결 | 프로토콜 | 인증 | 방향 |
|------|------|---------|------|------|
| ① | 프론트 ↔ 백엔드 | REST API (JSON) | JWT (Bearer Token) | 양방향 |
| ② | 백엔드 → 공공데이터 | HTTP GET (JSON) | 서비스 키 (Query Param) | 단방향 |
| ③ | 프론트 → 카카오지도 | JavaScript SDK | JavaScript 키 (도메인) | 단방향 |

### 상세 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         [React 프론트엔드]                               │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ axios.ts │  │ animal.ts│  │ admin.ts │  │authStore │               │
│  │(Instance)│  │ (API)    │  │ (API)    │  │(Zustand) │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘               │
│       │              │              │                                    │
│       └──────────────┼──────────────┘                                    │
│                      │                                                   │
│  ┌───────────────────┼──────────────────────────────┐                   │
│  │           AnimalDetailPage.tsx                     │                   │
│  │                   │                                │                   │
│  │  ┌────────────────┴────────────────────────┐      │                   │
│  │  │ GET /api/animals/{id}                    │      │                   │
│  │  │ → shelterAddress, shelterLat, shelterLng │      │                   │
│  │  └────────────────┬────────────────────────┘      │                   │
│  │                   │                                │                   │
│  │           KakaoMap.tsx ──── SDK ────→ [카카오 서버]  │                   │
│  │           (지도 + 마커)              (지도 타일)     │                   │
│  └────────────────────────────────────────────────────┘                   │
│                                                                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ REST API (① Axios + JWT)
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      [Spring Boot 백엔드]                                │
│                                                                         │
│  ┌──────────────────┐  ┌────────────────────┐  ┌──────────────────┐    │
│  │ AnimalController  │  │AdminAnimalController│  │  SecurityConfig  │    │
│  │ GET /api/animals  │  │POST .../sync-from..│  │ JWT + CORS       │    │
│  └────────┬─────────┘  └─────────┬──────────┘  └──────────────────┘    │
│           │                      │                                      │
│  ┌────────┴─────────┐  ┌────────┴───────────┐                          │
│  │  AnimalService    │  │ AnimalSyncService   │                          │
│  │  toResponse()     │  │ syncFromPublicApi() │                          │
│  │  (Entity→DTO)     │  │ upsertAnimal()      │                          │
│  └────────┬─────────┘  └────────┬───────────┘                          │
│           │                      │                                      │
│           │             ┌────────┴───────────┐                          │
│           │             │  PublicApiService    │                          │
│           │             │  WebClient 호출      │ ── ② ──→ [공공데이터포털]  │
│           │             └────────────────────┘                          │
│           │                                                             │
│  ┌────────┴─────────────────────────────────┐                          │
│  │              MySQL Database                │                          │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────┐ │                          │
│  │  │ animals  │  │ shelters │  │sync_    │ │                          │
│  │  │          │  │ (lat,lng)│  │history  │ │                          │
│  │  └──────────┘  └──────────┘  └─────────┘ │                          │
│  └──────────────────────────────────────────┘                          │
│                                                                         │
│  ┌────────────────────────────┐                                         │
│  │ PublicApiSyncScheduler     │                                         │
│  │ @Scheduled(cron = "0 0 2") │ ── 매일 새벽 2시 자동 실행                │
│  └────────────────────────────┘                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 사용자 시나리오별 흐름

**시나리오 1: 사용자가 동물 목록을 본다**

```
[사용자] → [React] → GET /api/animals → [AnimalController]
                                             → [AnimalService.findAll()]
                                             → [AnimalRepository → MySQL]
                                             ← List<AnimalResponse> (JSON)
         ← 동물 카드 목록 렌더링
```

**시나리오 2: 사용자가 동물 상세 + 보호소 위치를 본다**

```
[사용자] → [React] → GET /api/animals/42 → [AnimalController]
                                                → [AnimalService.findById(42)]
                                                → Animal + Shelter (lat, lng)
                                                → toResponse() 변환
                                                ← AnimalResponse (JSON)
         ← [AnimalDetailPage]
              → [KakaoMap] → 카카오 SDK → 지도 + 마커 렌더링
```

**시나리오 3: 매일 새벽 자동 동기화**

```
[cron 02:00] → [PublicApiSyncScheduler]
                → [AnimalSyncService.syncDailySchedule()]
                    → [PublicApiService] → 공공API 호출 (수십 페이지)
                    → 각 동물 upsert → MySQL 저장
                    → markExpiredAsAdopted()
                → [SyncHistoryService] → 이력 저장
```

**시나리오 4: 관리자가 수동 동기화한다**

```
[관리자] → [React Admin] → POST /api/admin/animals/sync-from-public-api?days=7
                                → [AdminAnimalController]
                                    → [AnimalService.syncFromPublicApiWithStatus()]
                                        → [AnimalSyncService] → [PublicApiService] → 공공API
                                    → [SyncHistoryService] → 이력 저장
                                ← { addedCount: 42, updatedCount: 15, ... }
         ← "동기화 완료: 42건 추가, 15건 수정"
```

## What — 기술 스택 종합

### 연결별 기술 정리

| 연결 | 기술 스택 | 관련 파일 |
|------|----------|----------|
| ① 프론트↔백엔드 | Axios + JWT + CORS | `axios.ts`, `authStore.ts`, `CorsConfig.java`, `SecurityConfig.java` |
| ② 백엔드→공공API | WebClient + 서비스 키 | `PublicApiService.java`, `AnimalSyncService.java` |
| ③ 프론트→카카오 | JavaScript SDK + 도메인 키 | `KakaoMap.tsx`, `AnimalDetailPage.tsx` |

### 환경 변수 종합

| 환경 변수 | 위치 | 용도 |
|----------|------|------|
| `JWT_SECRET` | `backend/.env` | JWT 토큰 서명 |
| `DATA_API_KEY` | `backend/.env` | 공공데이터포털 인증 |
| `PUBLIC_API_SYNC_ENABLED` | `backend/.env` | 자동 동기화 켜기/끄기 |
| `VITE_API_BASE_URL` | `frontend/.env` | 백엔드 API 주소 |
| `VITE_MAP_API_KEY` | `frontend/.env` | 카카오지도 JavaScript 키 |

### 보안 체크리스트

| 항목 | 확인 |
|------|------|
| JWT Secret이 `.env`에 있고 Git에 올라가지 않는가? | `.gitignore` 확인 |
| 공공 API 키가 프론트엔드 코드에 포함되지 않았는가? | `VITE_` 접두사가 **없어야** 함 |
| 카카오 JavaScript 키에 도메인 제한이 설정되었는가? | 카카오 개발자 콘솔 확인 |
| CORS 허용 Origin이 운영 도메인으로 제한되었는가? | `application.yml` 확인 |
| Admin API에 권한 체크가 있는가? | `SecurityConfig.java` 확인 |

> 📌 **핵심 정리**
> - 이 프로젝트는 **3가지 API 연결**로 구성: REST+JWT, WebClient+서비스키, SDK+도메인키
> - 각 연결은 **역할, 인증, 방향**이 다르다
> - 환경 변수는 `backend/.env`(서버 전용)와 `frontend/.env`(클라이언트 포함)로 분리
> - 전체 아키텍처를 이해하면 "어디서 에러가 났는지" 빠르게 추적할 수 있다

> ⚠️ **자주 하는 실수**
> - 프론트 `.env`에 서버 전용 키를 넣는다 → `VITE_` 접두사가 붙으면 번들에 포함되어 노출됨
> - 아키텍처를 이해하지 않고 디버깅한다 → "동물이 안 보여요"가 API 호출 문제인지, DB 문제인지, 동기화 문제인지 구분 못함
> - 환경별 설정을 분리하지 않는다 → 개발 환경에서 운영 DB를 동기화하는 사고

> 📚 **더 알아보기**
> - **12-Factor App**: 환경 변수 기반 설정 관리 원칙
> - **Spring Profiles**: `application-dev.yml`, `application-prod.yml`로 환경별 설정 분리
> - **Vite 환경 변수 모드**: `.env.development`, `.env.production`으로 환경별 분리

> 💡 **초보자 핵심 포인트: 3가지 연결의 핵심 차이**
>
> ```
> 연결 ①  프론트 ↔ 백엔드     양방향   JWT Bearer Token     우리가 만든 API
> 연결 ②  백엔드 → 공공API    단방향   서비스 키 (숨김)       남이 만든 API (서버에서 호출)
> 연결 ③  프론트 → 카카오      단방향   JS 키 (도메인 제한)    남이 만든 API (브라우저에서 호출)
> ```
>
> **면접 답변 포인트**: "이 프로젝트는 3가지 API 연결이 있고, 각각 인증 방식과 호출 방향이 다릅니다."

<details>
<summary><strong>✅ 초보자 체크리스트 — 10장 완료 확인</strong></summary>

- [ ] 3가지 API 연결 (①②③)의 프로토콜, 인증, 방향을 각각 설명할 수 있다
- [ ] 상세 아키텍처 다이어그램에서 각 컴포넌트의 위치를 이해했다
- [ ] 4가지 사용자 시나리오의 데이터 흐름을 따라갈 수 있다
- [ ] 환경 변수 5개의 위치와 용도를 설명할 수 있다
- [ ] 보안 체크리스트 5가지를 확인할 수 있다
- [ ] "프로젝트 아키텍처를 설명해주세요"에 30초 안에 답할 수 있다

</details>

---

# 11장. 실전 트러블슈팅 모음

> **이 장에서 배우는 것**: 외부 API 연동에서 가장 자주 발생하는 6가지 문제의 원인과 해결법을 미리 익히고, 체계적인 디버깅 순서를 배운다.
>
> **관련 소스코드**:
> [`CorsConfig.java`](../backend/src/main/java/com/dnproject/platform/config/CorsConfig.java) ·
> [`axios.ts`](../frontend/src/lib/axios.ts) ·
> [`KakaoMap.tsx`](../frontend/src/components/map/KakaoMap.tsx)

> 💡 **초보자를 위한 비유**: 트러블슈팅은 **병원 진단**과 같다. 환자가 "아파요"라고 하면, 의사는 **어디가 아픈지 범위를 좁히고**, **증상에 맞는 검사**를 한다. "동물 목록이 안 보여요"라는 증상도 마찬가지로, DB 문제인지 → API 문제인지 → CORS 문제인지 → 인증 문제인지 순서대로 범위를 좁혀야 한다.

## Why — 미리 알면 시간을 절약한다

외부 API 연동은 **우리가 통제할 수 없는 부분**이 많아서 다양한 문제가 발생한다. 이 장에서는 이 프로젝트에서 발생할 수 있는 주요 문제와 해결법을 정리한다.

---

### 문제 1: 공공데이터 API 키 인코딩 이슈

**증상**: API 호출 시 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR` 응답

**원인**: 공공데이터포털에서 발급하는 Encoding 키에는 `%2B`, `%2F` 같은 URL 인코딩 문자가 이미 포함되어 있다. 그런데 `UriComponentsBuilder`가 이것을 **한 번 더 인코딩**하면:

```
원래 키:     AbCd%2BeFgH%2F...
이중 인코딩: AbCd%252BeFgH%252F...    ← %가 %25로 변환됨
```

**해결**:

```java
// ✅ 올바른 방법: build().toUriString()으로 인코딩 제어
String uri = builder.build().toUriString();
// build()는 추가 인코딩을 하지 않음

// ❌ 잘못된 방법: toUriString()을 build(true)와 함께 사용
String uri = builder.build(true).toUriString();
// build(true)는 이미 인코딩된 값을 다시 인코딩할 수 있음
```

또는 `serviceKey`를 `queryParam`이 아닌 문자열로 직접 삽입:

```java
// 대안: 서비스 키만 직접 삽입
String baseUri = builder.build().toUriString();
String uri = baseUri + "&serviceKey=" + serviceKey;  // 추가 인코딩 방지
```

**체크리스트**:
- [ ] 공공데이터포털에서 **Encoding 키**를 복사했는가? (Decoding 키 아님)
- [ ] `UriComponentsBuilder`가 키를 이중 인코딩하지 않는가?
- [ ] 브라우저에서 직접 URL을 호출해서 정상 응답이 오는가?

---

### 문제 2: WebClient 타임아웃 설정

**증상**: 대량 동기화 시 `ReadTimeoutException` 또는 `ConnectTimeoutException`

**원인**: WebClient의 기본 타임아웃이 짧을 수 있다. 공공 API가 느리게 응답하면 타임아웃이 발생한다.

**해결**: WebClient에 커스텀 타임아웃 설정:

```java
// WebClient 설정 (Configuration 클래스)
@Bean
public WebClient.Builder webClientBuilder() {
    HttpClient httpClient = HttpClient.create()
        .responseTimeout(Duration.ofSeconds(30))          // 응답 타임아웃 30초
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000); // 연결 타임아웃 10초

    return WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(httpClient));
}
```

**권장 타임아웃 값**:

| 설정 | 값 | 이유 |
|------|---|------|
| 연결 타임아웃 | 10초 | 서버 연결 자체가 10초 이상 걸리면 장애 |
| 응답 타임아웃 | 30초 | 공공 API는 느릴 수 있으므로 여유 있게 |
| 프론트 Axios 타임아웃 (동기화) | 180초 | 전체 동기화가 수분 소요 |
| 프론트 Axios 타임아웃 (일반) | 10초 | 일반 API 호출 |

---

### 문제 3: 대량 동기화 시 DB 부하

**증상**: 동기화 중 다른 API 응답이 느려짐, DB 커넥션 풀 고갈

**원인**: `@Transactional`로 전체 동기화를 하나의 트랜잭션으로 감싸면, 수천 건의 insert/update가 하나의 DB 커넥션을 오래 점유한다.

**현재 프로젝트 접근 (실용적)**:

```java
@Transactional
public SyncResult syncFromPublicApi(int days, Integer maxPages, String speciesFilter) {
    // 전체를 하나의 트랜잭션으로 처리
    // 장점: 원자성 보장 (중간 실패 시 전체 롤백)
    // 단점: 트랜잭션이 길어질 수 있음
}
```

**개선 방향 (대규모 시)**:

```java
// 페이지 단위로 트랜잭션 분리
for (int page = 1; page <= maxPages; page++) {
    syncSinglePage(page);   // 각 페이지를 별도 트랜잭션으로
}

@Transactional
public void syncSinglePage(int page) {
    // 100건 단위로 커밋
}
```

**체크리스트**:
- [ ] `maxPages` 파라미터로 동기화 범위를 제한할 수 있는가?
- [ ] 동기화 중 일반 API 응답 시간이 정상인가?
- [ ] HikariCP 커넥션 풀 사이즈가 충분한가? (기본 10)

---

### 문제 4: 카카오 SDK 로드 실패

**증상**: "지도를 불러올 수 없습니다" 에러 메시지 표시

**원인과 해결**:

| 원인 | 확인 방법 | 해결 |
|------|----------|------|
| API 키 미설정 | `.env`에 `VITE_MAP_API_KEY` 있는가? | 키 설정 |
| 도메인 미등록 | 카카오 개발자 콘솔 확인 | 도메인 추가 |
| HTTPS 문제 | 로컬에서 `http://`로 접속하는가? | 개발 시 http OK, 운영 시 https 필요 |
| 네트워크 차단 | `dapi.kakao.com` 접근 가능한가? | 방화벽/VPN 확인 |
| Adblock | 광고 차단기가 SDK를 차단 | 예외 등록 또는 사용자 안내 |

프로젝트의 KakaoMap.tsx는 이미 여러 에러 상황을 처리한다:

```typescript
// API 키 확인
if (!APP_KEY || APP_KEY === 'your_map_api_key_here') {
  setError('지도 API 키가 설정되지 않았습니다.');
  return;
}

// 좌표와 주소 모두 없는 경우
if (!hasCoords && (!address || !address.trim())) {
  setError('표시할 주소가 없습니다.');
  return;
}

// SDK 로드 실패
script.onerror = () => reject(new Error('Failed to load Kakao Maps script'));

// Geocoding 실패
if (status !== kakao.maps.services.Status.OK) {
  setError('주소를 찾을 수 없습니다.');
}
```

---

### 문제 5: CORS 에러 디버깅 체크리스트

**증상**: 브라우저 콘솔에 `Access-Control-Allow-Origin` 에러

**이 프로젝트의 CORS 설정**:

```java
// CorsConfig.java
config.setAllowedOrigins(List.of(allowedOrigins.split(",")));   // "http://localhost:5173"
config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
config.setAllowedHeaders(List.of("*"));
config.setAllowCredentials(true);
config.setMaxAge(3600L);
```

**디버깅 순서**:

```
1. 에러 메시지를 정확히 읽는다
   ├── "No 'Access-Control-Allow-Origin'" → Origin이 허용 목록에 없음
   ├── "Method PUT is not allowed" → HTTP 메서드가 허용 목록에 없음
   └── "Request header field X is not allowed" → 헤더가 허용되지 않음

2. 확인할 것들
   ├── 프론트 주소가 cors.allowed-origins에 포함되어 있는가?
   │   └── http://localhost:5173 vs http://localhost:3000
   ├── 포트 번호까지 정확히 일치하는가?
   │   └── :5173 ≠ :5174 (Vite가 포트를 자동 변경했을 수 있음)
   ├── 프로토콜이 일치하는가?
   │   └── http ≠ https
   └── SecurityConfig에서 CORS가 활성화되었는가?
       └── .cors(cors -> cors.configurationSource(...))

3. Preflight (OPTIONS) 요청이 통과하는가?
   └── SecurityConfig에서 OPTIONS를 permitAll 했는가?
```

**빠른 확인 방법**: 브라우저 개발자 도구 → Network 탭 → 실패한 요청 클릭 → Response Headers에 `Access-Control-Allow-Origin`이 있는지 확인

---

### 문제 6: JWT 토큰 만료 시 사용자 경험

**증상**: 갑자기 로그인 페이지로 이동, 작성 중인 내용 유실

**이 프로젝트의 토큰 갱신 흐름**:

```typescript
// axios.ts — Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 에러 + 첫 번째 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          // 리프레시 토큰 없음 → 로그인 페이지로
          window.location.href = '/login';
          return;
        }

        // 리프레시 토큰으로 새 Access Token 발급
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        // 새 토큰으로 저장 + 원래 요청 재시도
        const accessToken = response.data.data.accessToken;
        storage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // 리프레시도 실패 → 로그인 페이지로
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

**흐름**:

```
API 호출 → 401 (Access Token 만료)
  │
  ├── Refresh Token 있음?
  │     ├── YES → POST /auth/refresh → 새 Access Token 발급
  │     │          ├── 성공 → 원래 요청 자동 재시도 (사용자 모름)
  │     │          └── 실패 → /login 이동
  │     └── NO → /login 이동
  │
  └── _retry = true (무한 루프 방지)
```

**이 프로젝트의 토큰 유효기간**:

```yaml
# application.yml
jwt:
  access-token-validity: 86400    # 24시간
  refresh-token-validity: 2592000  # 30일
```

사용자는 **30일간** 로그인 상태를 유지할 수 있다. Access Token이 만료되면 Refresh Token으로 자동 갱신되므로, 사용자는 토큰 만료를 인지하지 못한다.

---

## 트러블슈팅 종합 결정 트리

```
문제 발생!
  │
  ├── "동물 목록이 비어있다"
  │     ├── DB에 데이터가 있는가? → SELECT COUNT(*) FROM animals
  │     │     ├── 없음 → 동기화를 실행했는가?
  │     │     │          ├── 아니오 → POST /api/admin/animals/sync-from-public-api
  │     │     │          └── 예 → sync-history 확인 → 에러 있는가?
  │     │     │                   ├── API 키 문제 → 문제 1 참고
  │     │     │                   └── 네트워크 문제 → 문제 2 참고
  │     │     └── 있음 → API 응답이 정상인가?
  │     │              ├── CORS 에러 → 문제 5 참고
  │     │              └── 401 에러 → 문제 6 참고
  │
  ├── "지도가 안 보인다"
  │     ├── 콘솔에 에러가 있는가?
  │     │     ├── "API 키가 설정되지 않았습니다" → .env 확인
  │     │     ├── "Failed to load Kakao Maps" → 문제 4 참고
  │     │     └── "주소를 찾을 수 없습니다" → 백엔드가 주소를 보내는가?
  │     └── 에러 없이 빈 회색 박스? → shelterAddress/Lat/Lng 모두 null
  │
  ├── "동기화가 느리다"
  │     ├── 공공 API 응답이 느린가? → 문제 2 (타임아웃)
  │     └── DB 저장이 느린가? → 문제 3 (DB 부하)
  │
  └── "프론트에서 API 호출이 실패한다"
        ├── CORS 에러? → 문제 5
        ├── 401 에러? → 문제 6
        └── 500 에러? → 서버 로그 확인
```

> 📌 **핵심 정리**
> - 외부 API 연동의 트러블슈팅은 **어디에서 문제가 발생했는지** 범위를 좁히는 것이 핵심
> - API 키 인코딩, 타임아웃, CORS, 토큰 만료는 **가장 빈번한** 문제들
> - 서버 에러는 **로그 + SyncHistory**로 추적, 프론트 에러는 **브라우저 콘솔 + UI**로 추적
> - 체계적인 디버깅 순서(결정 트리)를 따르면 시간을 크게 절약할 수 있다

> ⚠️ **자주 하는 실수**
> - 에러 메시지를 읽지 않고 "안 돼요"라고만 보고한다 → 에러 메시지가 해결의 90%
> - 프론트 문제인지 백엔드 문제인지 구분하지 않는다 → Network 탭에서 요청/응답을 먼저 확인
> - 로컬에서 잘 되는데 배포하면 안 된다 → 환경 변수(`.env`)가 서버에 제대로 설정되었는지 확인
> - 공공 API 문제를 우리 코드 문제로 착각한다 → 브라우저에서 URL을 직접 호출해서 원인 분리

> 📚 **더 알아보기**
> - Spring Actuator: 서버 상태 모니터링 엔드포인트 (`/actuator/health`, `/actuator/metrics`)
> - Sentry / LogRocket: 프론트엔드 에러 추적 도구
> - Spring Boot Admin: 서버 관리 UI
> - Postman / Insomnia: API 테스트 도구 (CORS 없이 직접 호출 가능)

> 💡 **초보자 핵심 포인트: 디버깅 3단계 원칙**
>
> ```
> 1단계: 어디서 에러가 났는가?     → 브라우저 콘솔 vs 서버 로그
> 2단계: 에러 메시지를 정확히 읽는다 → 90%의 해결책이 메시지에 있다
> 3단계: 원인을 분리한다           → 외부 API 문제인가? 우리 코드 문제인가?
> ```
>
> **가장 흔한 실수**: 에러 메시지를 읽지 않고 코드부터 고치려 한다!

<details>
<summary><strong>✅ 초보자 체크리스트 — 11장 완료 확인</strong></summary>

- [ ] 6가지 트러블슈팅 문제를 각각 한 줄로 요약할 수 있다
- [ ] API 키 인코딩 이슈의 원인과 해결법을 안다
- [ ] WebClient 타임아웃 설정 방법을 안다
- [ ] 카카오 SDK 로드 실패 시 확인해야 할 5가지를 안다
- [ ] CORS 에러 디버깅 순서를 따라갈 수 있다
- [ ] JWT 토큰 갱신 흐름 (401 → refresh → 재시도)을 이해했다
- [ ] 종합 결정 트리를 따라 문제의 범위를 좁힐 수 있다

</details>

---

## 파트 D 종합 정리

### 장별 핵심 요약

| 장 | 핵심 한 줄 요약 | 기억할 키워드 |
|---|----------------|-------------|
| 7장 | 카카오지도는 브라우저 전용 SDK → 프론트에서 호출, 백엔드는 좌표만 준비 | DOM, JavaScript SDK, 도메인 인증 |
| 8장 | KakaoMap.tsx는 좌표 우선/주소 Fallback 전략, 백엔드는 최소 주소를 제공해야 함 | Props, Geocoding, `autoload=false` |
| 9장 | 외부 API 호출 위치는 키 보안·데이터 특성·SDK·CORS 4가지로 판단 | 판단 플로차트, 두 패턴 공존 |
| 10장 | 프로젝트는 3가지 API 연결로 구성: REST+JWT, WebClient+서비스키, SDK+도메인키 | 3가지 연결, 환경 변수 분리 |
| 11장 | 트러블슈팅은 에러 범위를 좁히는 것이 핵심, 결정 트리를 따라 진단 | 인코딩, 타임아웃, CORS, JWT |

### 파트 C→D 학습 흐름 정리

```
파트 C (백엔드 중심 외부 API)              파트 D (프론트 중심 외부 API + 종합)
━━━━━━━━━━━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1장. 외부 API 개념                         7장. 카카오지도 — 프론트에서 호출하는 이유
2장. API 키와 환경 변수                     8장. KakaoMap.tsx 구현 분석
3장. WebClient로 API 호출                  9장. 두 패턴 비교 (C vs D)
4장. 동기화와 Upsert                       10장. 종합 아키텍처 (3가지 API 연결)
5장. 스케줄링 (@Scheduled)                 11장. 실전 트러블슈팅
6장. 관리자 수동 동기화
```

### 이 프로젝트의 외부 API 연동 전체 그림

```
                     ┌─── 연결 ② ───┐
                     │  WebClient    │
                     │  서비스 키     │
                     ▼               │
              [공공데이터포털]    [Spring Boot 백엔드]
                                     │
                              연결 ①  │  REST API + JWT
                                     │
                              [React 프론트엔드]
                                     │
                              연결 ③  │  JavaScript SDK
                                     │       + 도메인 키
                                     ▼
                              [카카오지도 서버]
```

---

## 관련 문서 바로가기

| 이전 문서 | 현재 문서 | 다음 문서 |
|----------|----------|----------|
| [← 파트 C: 외부 API 연동](./STUDY_PART_C_외부_API_연동.md) | **파트 D: 카카오지도 연동과 종합 비교** | [파트 E: Terraform 인프라 →](./STUDY_PART_E_Terraform_인프라_생성.md) |

| 문서 | 설명 |
|------|------|
| [파트 A: REST API 기반구조](./STUDY_PART_A_REST_API_기반구조.md) | CORS, Security, JWT, ApiResponse |
| [파트 B: 실전 API 개발](./STUDY_PART_B_실전_API_개발.md) | RESTful 설계, Entity→DTO→Controller |
| [파트 C: 외부 API 연동](./STUDY_PART_C_외부_API_연동.md) | 공공데이터 API, WebClient, 동기화 |
| [파트 E: Terraform 인프라](./STUDY_PART_E_Terraform_인프라_생성.md) | AWS 인프라 코드(IaC) |
| [파트 F: CI/CD와 환경변수](./STUDY_PART_F_CICD와_환경변수.md) | GitHub Actions, 배포 자동화 |
| [파트 G: 안정화와 트러블슈팅](./STUDY_PART_G_안정화와_트러블슈팅.md) | 운영 중 문제 해결 |
| [카카오맵 설정 가이드](./KAKAO_MAP_DEV_SETUP.md) | 카카오 개발자 콘솔 설정, 도메인 등록 |
| [DB 스키마](./DATABASE.md) | shelters 테이블 (위도/경도 컬럼) |

> **학습 추천 순서**: A(기반구조) → B(실전 API) → C(외부 API 백엔드) → **D(외부 API 프론트 + 종합)** → E(인프라) → F(CI/CD) → G(트러블슈팅)

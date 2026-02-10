# Spring Boot + React REST API 연동 스터디 — 파트 C: 외부 API 연동

> **프로젝트**: 62댕냥이 (유기동물 입양/임보 매칭 플랫폼)
> **기술 스택**: Spring Boot 3.2 + Java 21 / React 18 + TypeScript + Vite
> **작성 기준**: 실제 프로젝트 코드 (`DN_project01`)
> **선행 학습**: [파트 A: 기반 구조](./STUDY_PART_A_REST_API_기반구조.md) — CORS, Security, JWT, ApiResponse
> **선행 학습**: [파트 B: 실전 API 개발](./STUDY_PART_B_실전_API_개발.md) — RESTful 설계, Entity→DTO→Controller, 페이지네이션

---

## 관련 문서 바로가기

| 문서 | 설명 |
|------|------|
| [파트 A: REST API 기반구조](./STUDY_PART_A_REST_API_기반구조.md) | CORS, Security, JWT, ApiResponse 공통 응답 |
| [파트 B: 실전 API 개발](./STUDY_PART_B_실전_API_개발.md) | RESTful 설계, Entity→DTO→Controller, 페이지네이션 |
| [파트 D: 카카오지도 연동](./STUDY_PART_D_카카오지도_연동과_종합비교.md) | 카카오맵 API 연동, 프론트 호출 패턴 비교 |
| [파트 E: Terraform 인프라](./STUDY_PART_E_Terraform_인프라_생성.md) | AWS 인프라 코드(IaC) |
| [파트 F: CI/CD와 환경변수](./STUDY_PART_F_CICD와_환경변수.md) | GitHub Actions, 배포 자동화 |
| [파트 G: 안정화와 트러블슈팅](./STUDY_PART_G_안정화와_트러블슈팅.md) | 운영 중 문제 해결, 디버깅 |
| [공공 API 참고자료](./PUBLIC_API_REFERENCES.md) | data.go.kr API 상세 스펙 |
| [DB 스키마](./DATABASE.md) | animals, shelters, sync_history 테이블 구조 |

---

## 이 문서를 읽기 전에: 외부 API 연동의 전체 그림

파트 B에서는 "프론트엔드 → 우리 백엔드 → DB"의 흐름을 배웠다. 파트 C에서는 **"외부 서버 → 우리 백엔드 → DB"** 라는 새로운 데이터 흐름을 배운다.

```
파트 B에서 배운 것 (내부 API):
  [사용자 브라우저] ──→ [우리 백엔드] ──→ [우리 DB]

파트 C에서 배울 것 (외부 API):
  [공공데이터포털 서버] ──→ [우리 백엔드] ──→ [우리 DB]
                              ↑
                      PublicApiService가 외부 서버를 호출해서 데이터를 가져온다
```

**핵심 차이**: 내부 API는 프론트엔드가 우리를 호출하지만, 외부 API는 **우리가 남의 서버를 호출**한다. 남의 서버는 우리가 통제할 수 없으므로 **방어적 코딩**이 필수다.

> **소스코드 바로가기** (이 문서에서 다루는 핵심 파일들)
>
> | 분류 | 파일 | 경로 |
> |------|------|------|
> | API 호출 | `PublicApiService.java` | [`backend/.../service/PublicApiService.java`](../backend/src/main/java/com/dnproject/platform/service/PublicApiService.java) |
> | 데이터 동기화 | `AnimalSyncService.java` | [`backend/.../service/AnimalSyncService.java`](../backend/src/main/java/com/dnproject/platform/service/AnimalSyncService.java) |
> | 자동 스케줄 | `PublicApiSyncScheduler.java` | [`backend/.../config/PublicApiSyncScheduler.java`](../backend/src/main/java/com/dnproject/platform/config/PublicApiSyncScheduler.java) |
> | 수동 동기화 | `AdminAnimalController.java` | [`backend/.../controller/AdminAnimalController.java`](../backend/src/main/java/com/dnproject/platform/controller/AdminAnimalController.java) |
> | 공공API DTO | `AnimalItem.java` | [`backend/.../dto/publicapi/AnimalItem.java`](../backend/src/main/java/com/dnproject/platform/dto/publicapi/AnimalItem.java) |
> | 동기화 이력 | `SyncHistory.java` | [`backend/.../domain/SyncHistory.java`](../backend/src/main/java/com/dnproject/platform/domain/SyncHistory.java) |
> | 이력 서비스 | `SyncHistoryService.java` | [`backend/.../service/SyncHistoryService.java`](../backend/src/main/java/com/dnproject/platform/service/SyncHistoryService.java) |
> | 설정 파일 | `application.yml` | [`backend/src/main/resources/application.yml`](../backend/src/main/resources/application.yml) |
> | 프론트 API | `admin.ts` | [`frontend/src/api/admin.ts`](../frontend/src/api/admin.ts) |

---

## 목차

| 장 | 제목 | 핵심 키워드 | 관련 소스코드 |
|---|------|------------|-------------|
| [1장](#1장-외부-api-연동이란) | 외부 API 연동이란 | 내부 API vs 외부 API, 공공데이터포털 | 전체 아키텍처 |
| [2장](#2장-api-키-발급과-설정-관리) | API 키 발급과 설정 관리 | 환경 변수, @Value, application.yml | PublicApiService.java |
| [3장](#3장-webclient로-외부-api-호출하기) | WebClient로 외부 API 호출하기 | WebClient.Builder, UriComponentsBuilder, JSON 파싱 | PublicApiService.java, AnimalItem.java |
| [4장](#4장-데이터-동기화-로직) | 데이터 동기화 로직 | Upsert, DTO→Entity 변환, 증분 동기화 | AnimalSyncService.java |
| [5장](#5장-스케줄링--자동-동기화) | 스케줄링 — 자동 동기화 | @Scheduled, cron, @ConditionalOnProperty | PublicApiSyncScheduler.java |
| [6장](#6장-관리자-수동-동기화-api) | 관리자 수동 동기화 API | Admin 엔드포인트, 동기화 이력 관리 | AdminAnimalController.java, admin.ts |

---

# 1장. 외부 API 연동이란

> **이 장에서 배우는 것**: "외부 API"가 무엇인지, 우리가 만든 내부 API와 어떻게 다른지 이해한다. 이 프로젝트에서 공공데이터포털 API를 왜 사용하는지 알아본다.
>
> **관련 소스코드 바로가기**
> - [`PublicApiService.java`](../backend/src/main/java/com/dnproject/platform/service/PublicApiService.java) — 외부 API HTTP 호출 담당
> - [`AnimalSyncService.java`](../backend/src/main/java/com/dnproject/platform/service/AnimalSyncService.java) — 데이터 변환 + DB 저장
> - [`PublicApiSyncScheduler.java`](../backend/src/main/java/com/dnproject/platform/config/PublicApiSyncScheduler.java) — 자동 스케줄
> - [`AdminAnimalController.java`](../backend/src/main/java/com/dnproject/platform/controller/AdminAnimalController.java) — 수동 실행 API
>
> **관련 문서**: [공공 API 참고자료](./PUBLIC_API_REFERENCES.md) · [data.go.kr 메모](./data_go_kr.md)

## Why — 왜 외부 API를 연동하는가

우리 플랫폼은 유기동물 데이터가 핵심이다. 그런데 이 데이터를 **직접 입력**하려면 전국 수천 개 보호소에서 매일 올라오는 수백 건의 유기동물 정보를 사람이 일일이 등록해야 한다. 현실적으로 불가능하다.

다행히 **공공데이터포털(data.go.kr)** 에서 국가동물보호정보시스템의 유기동물 정보를 API로 제공한다. 이 API를 호출하면 전국의 유기동물 데이터를 자동으로 가져올 수 있다.

```
[공공데이터포털 API]  ─── JSON ──→  [Spring Boot 백엔드]  ──→  [DB 저장]
     (외부 서버)                      (우리 서버)                (우리 DB)
```

### 내부 API vs 외부 API

| 구분 | 내부 API | 외부 API |
|------|----------|----------|
| 누가 만들었나 | 우리 팀 | 다른 조직 (정부, 기업 등) |
| 서버 위치 | 우리 서버 (localhost:8080) | 외부 서버 (apis.data.go.kr) |
| 인증 방식 | JWT 토큰 | API 키 (서비스 키) |
| 응답 형식 | 우리가 설계 (`ApiResponse<T>`) | 제공자가 정한 형식 |
| 장애 시 | 우리가 직접 수정 | 기다려야 함 (우리가 못 고침) |
| 호출 방향 | 프론트엔드 → 백엔드 | 백엔드 → 외부 서버 |

핵심 차이: **외부 API는 우리가 통제할 수 없다.** 응답 형식이 바뀔 수도 있고, 서버가 다운될 수도 있고, 속도가 느릴 수도 있다. 그래서 **방어적 코딩**이 필수다.

## How — 이 프로젝트의 외부 API 연동 구조

```
[공공데이터포털]                     [Spring Boot 백엔드]
     │                                    │
     │  ← HTTP GET (JSON) ─────────  PublicApiService      ← (1) API 호출 담당
     │                                    │
     │                              AnimalSyncService       ← (2) 데이터 변환 + DB 저장
     │                                    │
     │                              PublicApiSyncScheduler  ← (3) 자동 스케줄
     │                                    │
     │                              AdminAnimalController   ← (4) 수동 실행 API
```

4개 클래스가 각자의 역할을 담당한다. **단일 책임 원칙(SRP)** 을 따른 설계다.

| 클래스 | 역할 | 위치 |
|--------|------|------|
| `PublicApiService` | 외부 API HTTP 호출 + JSON 파싱 | `service/` |
| `AnimalSyncService` | API 데이터 → DB 엔티티 변환 + 저장 | `service/` |
| `PublicApiSyncScheduler` | 매일 자동 동기화 (cron) | `config/` |
| `AdminAnimalController` | 관리자 수동 동기화 엔드포인트 | `controller/` |

## What — 이 프로젝트에서 사용하는 공공 API

**국가동물보호정보시스템 구조동물조회 서비스 v2**

| API | URL | 용도 |
|-----|-----|------|
| 유기동물 조회 | `/abandonmentPublicService_v2/abandonmentPublic_v2` | 유기동물 목록 |
| 품종 조회 | `/abandonmentPublicService_v2/getKindList` | 품종코드 → 품종명 매핑 |
| 보호소 조회 | `/animalShelterSrvc_v2/shelterInfo_v2` | 보호소 정보 |

> 📌 **핵심 정리**
> - 외부 API 연동은 "우리 서버가 다른 서버의 API를 호출하는 것"
> - 내부 API와 달리 응답 형식, 가용성, 속도를 우리가 통제할 수 없다
> - 따라서 예외 처리, 타임아웃, 빈 응답 처리 등 **방어적 코딩**이 핵심
> - 이 프로젝트는 4개 클래스로 역할을 분리해서 관리한다

> ⚠️ **자주 하는 실수**
> - 외부 API를 프론트엔드에서 직접 호출하려 한다 → **CORS 문제 + API 키 노출**. 반드시 백엔드를 거쳐야 한다
> - 외부 API 장애 시 우리 서비스도 같이 죽는다 → 예외 처리 없이 호출하면 500 에러가 사용자에게 전달됨
> - API 키를 코드에 하드코딩한다 → Git에 올라가면 보안 사고. 반드시 환경 변수로 관리

### 초보자를 위한 비유: 외부 API = 다른 도서관에서 책 빌려오기

```
내부 API: 우리 도서관 서가에서 책을 꺼내는 것
  → 빠르고, 원하는 책이 항상 있고, 서가 위치를 우리가 정한다

외부 API: 옆 동네 도서관에 전화해서 책을 빌려오는 것
  → 느릴 수 있고, 전화가 안 될 수도 있고, 책 분류 방식이 다르다
  → 그래서 "빌려온 책을 우리 서가에 복사해두는 것(동기화)"이 핵심!
```

### 초보자 체크리스트 — 1장을 읽고 나서 확인해보자

- [ ] 내부 API와 외부 API의 차이 3가지를 설명할 수 있는가?
- [ ] 왜 외부 API를 프론트엔드에서 직접 호출하면 안 되는지 설명할 수 있는가?
- [ ] 이 프로젝트의 4개 클래스(`PublicApiService`, `AnimalSyncService`, `PublicApiSyncScheduler`, `AdminAnimalController`)가 각각 무슨 역할인지 말할 수 있는가?

---

# 2장. API 키 발급과 설정 관리

> **이 장에서 배우는 것**: 공공데이터포털에서 API 키를 발급받고, 코드에 안전하게 설정하는 방법을 배운다. "환경 변수"라는 개념이 처음이라면 이 장이 특히 중요하다.
>
> **관련 소스코드 바로가기**
> - [`PublicApiService.java`](../backend/src/main/java/com/dnproject/platform/service/PublicApiService.java) — `@Value`로 키 주입, `isApiKeyConfigured()` 검증
> - [`application.yml`](../backend/src/main/resources/application.yml) — 환경 변수 바인딩 설정
>
> **관련 문서**: [파트 F: CI/CD와 환경변수](./STUDY_PART_F_CICD와_환경변수.md) — 배포 환경에서의 환경 변수 관리

## Why — 왜 API 키가 필요한가

공공데이터포털 API는 **아무나** 호출할 수 없다. 누가 얼마나 호출하는지 추적하고, 과도한 호출을 차단하기 위해 **서비스 키(API Key)** 를 발급받아야 한다.

```
[우리 서버] → "유기동물 목록 주세요 + 내 인증키는 이겁니다" → [공공데이터포털]
                                                            ↓
                                                   "키 확인 완료, 데이터 보내줄게"
```

JWT 토큰이 "로그인한 사용자"를 증명하듯, API 키는 "허가받은 애플리케이션"을 증명한다.

## How — 환경 변수로 API 키 관리하기

### 1단계: 공공데이터포털에서 API 키 발급

1. [data.go.kr](https://data.go.kr) 회원가입
2. "국가동물보호정보시스템 구조동물조회 서비스" 검색 → 활용신청
3. 승인 후 **Encoding 키** 복사 (Decoding 키 아님!)

### 2단계: 환경 변수에 키 저장

```properties
# backend/.env (Git에 올리면 안 됨!)
DATA_API_KEY=AbCdEf123456789%2B...인코딩된키
```

`.env` 파일은 `.gitignore`에 반드시 포함해야 한다. API 키가 GitHub에 올라가면 악용될 수 있다.

### 3단계: application.yml에서 환경 변수 바인딩

실제 프로젝트의 `application.yml`:

```yaml
# application.yml
public-api:
  service-key: ${DATA_API_KEY:${PUBLIC_API_SERVICE_KEY:your-public-api-service-key}}
  base-url: ${PUBLIC_API_BASE_URL:https://apis.data.go.kr/1543061}
  sync-enabled: ${PUBLIC_API_SYNC_ENABLED:false}
  sync-cron: ${PUBLIC_API_SYNC_CRON:0 0 2 * * *}
```

이 설정을 뜯어보자:

```
${DATA_API_KEY:${PUBLIC_API_SERVICE_KEY:your-public-api-service-key}}
  │                │                       │
  │                │                       └─ 3순위: 기본값 (더미)
  │                └─ 2순위: PUBLIC_API_SERVICE_KEY 환경 변수
  └─ 1순위: DATA_API_KEY 환경 변수
```

Spring Boot의 **프로퍼티 폴백(Fallback) 문법**이다. `DATA_API_KEY`가 없으면 `PUBLIC_API_SERVICE_KEY`를 찾고, 그것도 없으면 `your-public-api-service-key`(더미)가 된다.

### 4단계: Java 코드에서 @Value로 주입

```java
// PublicApiService.java
@Value("${public-api.service-key:}")
private String serviceKey;

@Value("${public-api.base-url:https://apis.data.go.kr/1543061}")
private String apiBaseUrl;
```

`@Value`가 `application.yml`의 값을 필드에 주입한다.

```
application.yml → public-api.service-key → @Value → serviceKey 필드
.env → DATA_API_KEY → application.yml에서 치환 → serviceKey 필드
```

## What — 키 상태 확인 로직

실제 프로젝트에서는 애플리케이션 시작 시 API 키 상태를 확인한다:

```java
// PublicApiService.java
public boolean isApiKeyConfigured() {
    return serviceKey != null
        && !serviceKey.isBlank()
        && !"your-public-api-service-key".equals(serviceKey);
}

@PostConstruct
void logApiKeyStatus() {
    if (isApiKeyConfigured()) {
        log.info("공공 API 키 로드됨 (접두사: {})",
            serviceKey.length() >= 8 ? serviceKey.substring(0, 8) + "..." : "?");
    } else {
        log.warn("공공 API 키 미설정. backend/.env 의 DATA_API_KEY 를 확인하세요.");
    }
}
```

**3중 방어**:
1. `null` 체크 — 환경 변수 자체가 없을 때
2. `isBlank()` 체크 — 빈 문자열일 때
3. 기본값 비교 — 더미값(`your-public-api-service-key`)이 그대로일 때

`@PostConstruct`는 Bean 생성 후 1회 실행되는 초기화 메서드다. 서버 시작 로그에서 바로 키 상태를 확인할 수 있다.

```
# 키가 설정된 경우
INFO  - 공공 API 키 로드됨 (접두사: AbCdEf12...)

# 키가 미설정인 경우
WARN  - 공공 API 키 미설정. backend/.env 의 DATA_API_KEY 를 확인하세요.
```

> 📌 **핵심 정리**
> - 공공 API 사용에는 **서비스 키(API Key)** 발급이 필수
> - API 키는 절대 코드에 하드코딩하지 않는다 → `.env` 파일 + 환경 변수
> - `application.yml`에서 `${ENV_VAR:기본값}` 문법으로 환경 변수를 바인딩
> - `@Value` 어노테이션으로 Java 필드에 주입
> - `@PostConstruct`로 서버 시작 시 키 상태를 로그에 출력해 빠르게 확인

> ⚠️ **자주 하는 실수**
> - `.env` 파일을 `.gitignore`에 넣지 않아서 API 키가 GitHub에 노출된다
> - **Decoding 키** 대신 **Encoding 키**를 사용해야 한다. 공공데이터포털에서 둘 다 제공하는데, URL 쿼리 파라미터로 보내려면 Encoding 키가 필요
> - 기본값으로 `your-public-api-service-key` 같은 더미를 넣되, 실제 키처럼 생긴 문자열을 넣으면 혼동 가능
> - `@Value`의 키 이름과 `application.yml`의 키 이름이 다르면 주입 실패 (오타 주의)

### 초보자를 위한 핵심 포인트: 환경 변수가 코드에 도달하기까지

```
.env 파일 (DATA_API_KEY=AbCdEf...)
        ↓ Spring Boot가 자동으로 읽음
application.yml (public-api.service-key: ${DATA_API_KEY:기본값})
        ↓ @Value 어노테이션이 주입
PublicApiService.java (private String serviceKey = "AbCdEf...")
        ↓ API 호출 시 사용
UriComponentsBuilder.queryParam("serviceKey", serviceKey)
```

이 흐름을 이해하면 "API 키가 안 먹혀요" 문제의 90%를 해결할 수 있다.

### 초보자 체크리스트 — 2장을 읽고 나서 확인해보자

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 직접 확인했는가?
- [ ] `${DATA_API_KEY:기본값}` 문법에서 `:`의 의미를 설명할 수 있는가?
- [ ] `@PostConstruct`가 언제 실행되는지 알겠는가?
- [ ] 직접 [`application.yml`](../backend/src/main/resources/application.yml)을 열어서 `public-api` 섹션을 확인했는가?

---

# 3장. WebClient로 외부 API 호출하기

> **이 장에서 배우는 것**: Spring의 `WebClient`로 외부 서버에 HTTP 요청을 보내는 방법, 그리고 공공 API의 "비일관적 응답"을 안전하게 파싱하는 방법을 배운다.
>
> **관련 소스코드 바로가기**
> - [`PublicApiService.java`](../backend/src/main/java/com/dnproject/platform/service/PublicApiService.java) — WebClient 호출, JSON 파싱, UriComponentsBuilder
> - [`AnimalItem.java`](../backend/src/main/java/com/dnproject/platform/dto/publicapi/AnimalItem.java) — 공공 API 응답 DTO
> - [`build.gradle.kts`](../backend/build.gradle.kts) — `spring-boot-starter-webflux` 의존성

## Why — 왜 WebClient를 사용하는가

Spring에서 HTTP 호출을 하는 방법은 여러 가지다:

| 방법 | 특징 | 상태 |
|------|------|------|
| `RestTemplate` | 동기, 간단함 | Spring 5부터 **유지보수 모드** (새 기능 추가 없음) |
| `WebClient` | 비동기/동기 모두 지원, 유연함 | **권장** (Spring WebFlux 모듈) |
| `RestClient` | 동기, WebClient의 동기 전용 버전 | Spring 6.1부터 신규 추가 |

이 프로젝트는 **WebClient**를 사용한다. 비록 `.block()`으로 동기 호출을 하지만, 나중에 비동기로 전환하기 쉽고, Spring에서 공식적으로 권장하는 방식이다.

```java
// RestTemplate (옛날 방식)
String json = restTemplate.getForObject(url, String.class);

// WebClient (현재 권장)
String json = webClientBuilder.build()
    .get()
    .uri(url)
    .retrieve()
    .bodyToMono(String.class)
    .block();   // ← 동기로 결과 대기
```

## How — PublicApiService 구조 분석

### 의존성 주입

```java
// PublicApiService.java
@Service
@RequiredArgsConstructor
@Slf4j
public class PublicApiService {

    private final WebClient.Builder webClientBuilder;   // Spring Boot 자동 구성
    private final ObjectMapper objectMapper;            // Jackson JSON 파서
```

`WebClient.Builder`를 직접 `new`하지 않는다. Spring Boot가 자동으로 Bean을 등록해주므로, **생성자 주입**으로 받기만 하면 된다.

`spring-boot-starter-webflux` 의존성이 필요하다:
```groovy
// build.gradle
implementation 'org.springframework.boot:spring-boot-starter-webflux'
```

### URL 구성 — UriComponentsBuilder

외부 API를 호출하려면 URL에 쿼리 파라미터를 붙여야 한다:

```
https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2
  ?serviceKey=인증키
  &pageNo=1
  &numOfRows=100
  &_type=json
  &upkind=417000
  &state=protect
  &bgnde=20250101
  &endde=20250107
```

이걸 문자열 연결로 만들면?

```java
// ❌ 나쁜 방법: 문자열 연결
String url = baseUrl + "?serviceKey=" + key + "&pageNo=" + page + "&upkind=" + upkind;
// → URL 인코딩 누락, 가독성 나쁨, 실수 발생 확률 높음
```

`UriComponentsBuilder`를 사용하면:

```java
// ✅ 좋은 방법: UriComponentsBuilder
var builder = UriComponentsBuilder
    .fromHttpUrl(getAbandonmentBase() + ABANDONMENT_LIST_PATH)
    .queryParam("serviceKey", serviceKey)
    .queryParam("pageNo", pageNo)
    .queryParam("numOfRows", numOfRows)
    .queryParam("_type", "json");

// 선택적 파라미터 — 있을 때만 추가
if (uprCd != null && !uprCd.isBlank()) builder.queryParam("upr_cd", uprCd);
if (orgCd != null && !orgCd.isBlank()) builder.queryParam("org_cd", orgCd);
if (upkind != null && !upkind.isBlank()) builder.queryParam("upkind", upkind);
builder.queryParam("state", state != null && !state.isBlank() ? state : "protect");
if (bgnde != null) builder.queryParam("bgnde", bgnde.format(DATE_FORMAT));
if (endde != null) builder.queryParam("endde", endde.format(DATE_FORMAT));

String uri = builder.build().toUriString();
```

장점:
- URL 인코딩을 자동으로 처리
- 선택적 파라미터를 조건부로 추가 가능
- 가독성이 좋음

### HTTP 호출 + 에러 처리

```java
// PublicApiService.java — getAbandonedAnimals()
try {
    String json = webClientBuilder.build()
            .get()                              // HTTP GET
            .uri(uri)                           // URL
            .retrieve()                         // 응답 받기
            .bodyToMono(String.class)           // 응답 본문을 String으로
            .block();                           // 동기 대기

    List<AnimalItem> result = parseAnimalItems(json);
    return result;

} catch (WebClientResponseException e) {
    // HTTP 4xx, 5xx 에러 (외부 서버 응답 에러)
    log.error("공공 API 유기동물 조회 실패: {} - 응답본문: {}",
        e.getMessage(), e.getResponseBodyAsString());
    return Collections.emptyList();

} catch (Exception e) {
    // 네트워크 에러, 타임아웃 등
    log.error("공공 API 유기동물 조회 실패: {}", e.getMessage());
    return Collections.emptyList();
}
```

핵심 패턴: **외부 API 호출 실패 시 빈 리스트를 반환**한다. 예외를 던지지 않는다.

```
외부 API 성공 → 데이터 리스트 반환 → 동기화 진행
외부 API 실패 → 빈 리스트 반환     → 동기화 건너뜀 (우리 서비스는 정상 동작)
```

이렇게 하면 공공 API가 일시적으로 장애가 나도 우리 서비스는 영향을 받지 않는다.

### JSON 응답 파싱 — 공공 API의 함정

공공데이터포털 API의 응답 구조:

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL SERVICE"
    },
    "body": {
      "items": {
        "item": [           ← 보통은 배열
          { "desertionNo": "448839202500001", ... },
          { "desertionNo": "448839202500002", ... }
        ]
      },
      "totalCount": 2
    }
  }
}
```

그런데 **결과가 1건일 때**:

```json
{
  "response": {
    "body": {
      "items": {
        "item": { "desertionNo": "448839202500001", ... }   ← 배열이 아니라 단일 객체!
      }
    }
  }
}
```

많은 공공 API가 이런 **비일관적 응답**을 한다. 1건이면 객체, 2건 이상이면 배열. Jackson의 `@JsonProperty`로 DTO에 바로 매핑하면 타입 에러가 발생한다.

해결: **수동으로 JSON을 파싱하면서 타입을 체크**한다.

```java
// PublicApiService.java — parseAnimalItems()
@SuppressWarnings("unchecked")
private List<AnimalItem> parseAnimalItems(String json) {
    try {
        if (json == null || json.isBlank()) return Collections.emptyList();

        // 1단계: JSON → Map으로 파싱
        Map<String, Object> map = objectMapper.readValue(json, new TypeReference<>() {});

        // 2단계: response.body.items.item 까지 탐색
        Object response = map.get("response");
        if (response == null) return Collections.emptyList();
        Object body = ((Map<String, Object>) response).get("body");
        if (body == null) return Collections.emptyList();
        Object items = ((Map<String, Object>) body).get("items");
        if (items == null || !(items instanceof Map)) return Collections.emptyList();
        Object item = ((Map<String, Object>) items).get("item");
        if (item == null) return Collections.emptyList();

        // 3단계: 배열이면 리스트로, 단일 객체면 리스트로 감싸기
        if (item instanceof List) {
            return objectMapper.convertValue(item, new TypeReference<List<AnimalItem>>() {});
        }
        // 단일 객체 → 1개짜리 리스트로 변환
        AnimalItem single = objectMapper.convertValue(item, AnimalItem.class);
        return List.of(single);

    } catch (Exception e) {
        log.warn("공공 API 응답 파싱 실패: {}", e.getMessage());
        return Collections.emptyList();
    }
}
```

흐름을 그림으로 보면:

```
JSON 문자열
  │
  ├─ null 또는 빈 문자열?  → 빈 리스트 반환
  │
  ├─ response 없음?        → 빈 리스트 반환
  │
  ├─ body 없음?            → 빈 리스트 반환 (+ header의 에러코드 로깅)
  │
  ├─ items 없음?           → 빈 리스트 반환
  │
  ├─ item이 List?          → List<AnimalItem>으로 변환
  │
  └─ item이 단일 객체?     → AnimalItem 1개를 List로 감싸서 반환
```

**모든 단계에서 null 체크**를 한다. 공공 API는 예상 밖의 응답을 줄 수 있으므로, 어느 레벨에서든 데이터가 없을 수 있다고 가정해야 한다.

### DTO 클래스 — AnimalItem

```java
// AnimalItem.java — 공공 API 응답의 개별 동물 항목
@Data
@JsonIgnoreProperties(ignoreUnknown = true)   // 모르는 필드 무시
public class AnimalItem {

    @JsonProperty("desertionNo")
    private String desertionNo;       // 유기번호 (고유 식별자)

    @JsonProperty("popfile1")
    @JsonAlias("popFile1")            // 대소문자 불일치 대응
    private String popfile1;           // 이미지1

    @JsonProperty("popfile2")
    @JsonAlias("popFile2")
    private String popfile2;           // 이미지2

    @JsonProperty("happenDt")
    private String happenDt;           // 접수일 (yyyyMMdd)

    @JsonProperty("kindCd")
    private String kindCd;             // 품종코드

    @JsonProperty("kindNm")
    private String kindNm;             // 품종명

    @JsonProperty("upKindCd")
    private String upKindCd;           // 축종코드 (417000=개, 422400=고양이)

    @JsonProperty("age")
    private String age;                // 나이 (예: "2022(년생)")

    @JsonProperty("weight")
    private String weight;             // 체중 (예: "5.2(Kg)")

    @JsonProperty("processState")
    private String processState;       // 상태 ("보호중", "입양" 등)

    @JsonProperty("sexCd")
    private String sexCd;              // 성별 (M, F, Q)

    @JsonProperty("neuterYn")
    private String neuterYn;           // 중성화 (Y, N, U)

    @JsonProperty("specialMark")
    private String specialMark;        // 특징

    @JsonProperty("careNm")
    private String careNm;             // 보호소명

    @JsonProperty("careAddr")
    private String careAddr;           // 보호소 주소

    @JsonProperty("orgNm")
    private String orgNm;              // 관할기관

    // ... 기타 필드
}
```

주요 어노테이션:

| 어노테이션 | 역할 | 왜 필요한가 |
|-----------|------|------------|
| `@JsonIgnoreProperties(ignoreUnknown = true)` | 알 수 없는 필드 무시 | API 버전 변경 시 새 필드 추가돼도 에러 안 남 |
| `@JsonProperty("desertionNo")` | JSON 키 ↔ Java 필드 매핑 | 이름이 다를 때 명시적 연결 |
| `@JsonAlias("popFile1")` | 대체 키 이름 인식 | API v1, v2 간 필드명 대소문자 불일치 대응 |

> 📌 **핵심 정리**
> - `WebClient`는 Spring에서 권장하는 HTTP 클라이언트 (RestTemplate 대체)
> - `UriComponentsBuilder`로 URL + 쿼리 파라미터를 안전하게 구성
> - 외부 API 호출 실패 시 예외를 던지지 않고 **빈 리스트를 반환**하는 방어적 패턴
> - 공공 API의 "1건=객체, N건=배열" 함정을 수동 파싱으로 해결
> - `@JsonIgnoreProperties(ignoreUnknown = true)`로 API 변경에 대비
> - `@JsonAlias`로 필드명 대소문자 불일치에 대비

> ⚠️ **자주 하는 실수**
> - `WebClient.Builder`를 매번 `new`로 생성한다 → Spring Boot이 자동 구성한 Bean을 주입받아야 한다
> - `.block()` 없이 `Mono`를 반환한다 → 동기 로직에서 데이터를 사용하려면 `.block()`으로 결과를 대기해야 한다
> - 공공 API 응답을 DTO에 바로 매핑한다 → 1건일 때 단일 객체가 와서 `MismatchedInputException` 발생
> - `@JsonIgnoreProperties` 없이 DTO를 만든다 → API 버전 업데이트로 새 필드가 추가되면 `UnrecognizedPropertyException` 발생
> - 외부 API 호출에서 예외를 그대로 throw한다 → 공공 API 장애가 우리 서비스 장애로 전파됨

### 초보자를 위한 핵심 포인트: "방어적 코딩"의 의미

이 장의 코드를 보면 **모든 줄에 null 체크**가 있다. 왜 이렇게까지 방어적인가?

```
내부 API (우리가 만든 것):
  → 응답 형식을 우리가 정했으므로 예상 가능
  → null 체크를 최소화해도 됨

외부 API (남이 만든 것):
  → 응답이 갑자기 바뀔 수 있음 (API 버전업)
  → 1건이면 배열이 아니라 객체가 올 수 있음
  → 필드 이름 대소문자가 달라질 수 있음
  → 서버가 에러를 주거나 아예 응답이 안 올 수 있음
  → 그래서 모든 단계에서 방어해야 함!
```

### 초보자 체크리스트 — 3장을 읽고 나서 확인해보자

- [ ] `WebClient`와 `RestTemplate`의 차이를 설명할 수 있는가?
- [ ] `UriComponentsBuilder`가 문자열 연결보다 좋은 이유를 알겠는가?
- [ ] 공공 API에서 "1건=객체, N건=배열" 문제를 어떻게 해결하는지 설명할 수 있는가?
- [ ] `@JsonIgnoreProperties(ignoreUnknown = true)`가 왜 필수인지 이해했는가?
- [ ] 직접 [`PublicApiService.java`](../backend/src/main/java/com/dnproject/platform/service/PublicApiService.java)를 열어서 `parseAnimalItems()` 메서드를 찾아봤는가?

---

# 4장. 데이터 동기화 로직

> **이 장에서 배우는 것**: 공공 API에서 받아온 데이터를 우리 DB에 저장하는 "동기화" 로직을 배운다. Upsert, 증분 동기화, DTO→Entity 변환 등 실무에서 자주 쓰는 패턴이다.
>
> **관련 소스코드 바로가기**
> - [`AnimalSyncService.java`](../backend/src/main/java/com/dnproject/platform/service/AnimalSyncService.java) — 동기화 핵심 로직 (Upsert, 매핑, 만료 보정)
> - [`Shelter.java`](../backend/src/main/java/com/dnproject/platform/domain/Shelter.java) — 보호소 Entity (자동 생성)
> - [`AddressRegionParser.java`](../backend/src/main/java/com/dnproject/platform/util/AddressRegionParser.java) — 주소에서 시/도, 시/군/구 파싱
> - [`AnimalRepository.java`](../backend/src/main/java/com/dnproject/platform/repository/AnimalRepository.java) — `findByPublicApiAnimalId()` 쿼리
>
> **관련 문서**: [DB 스키마](./DATABASE.md) — animals, shelters 테이블 구조

## Why — 왜 동기화가 필요한가

공공 API를 호출하면 유기동물 데이터를 받을 수 있다. 하지만 이 데이터를 **매번 실시간으로 호출**해서 보여주는 것은 좋지 않다.

| 방식 | 장점 | 단점 |
|------|------|------|
| 실시간 호출 (패스스루) | 항상 최신 데이터 | 느림, API 호출 제한, 장애 전파 |
| 주기적 동기화 (DB 저장) | 빠름, 안정적, 자유로운 검색 | 데이터가 최대 N시간 지연 |

이 프로젝트는 **주기적 동기화** 방식을 선택했다. 공공 API 데이터를 우리 DB에 저장해두고, 사용자는 우리 DB에서 빠르게 조회한다.

```
[공공 API] → (매일 동기화) → [우리 DB] → (실시간 조회) → [사용자]
```

### Upsert 패턴

동기화에서 가장 중요한 개념이 **Upsert(Update + Insert)** 이다:

```
새 데이터가 들어오면:
  - DB에 이미 있는가?  → Update (기존 데이터 수정)
  - DB에 없는가?       → Insert (새 데이터 추가)
```

이렇게 하면 같은 동물 데이터를 여러 번 동기화해도 **중복이 생기지 않는다**.

## How — AnimalSyncService 구조 분석

### 동기화 흐름 전체 그림

```
syncFromPublicApi(days=7, maxPages=null, speciesFilter=null)
  │
  ├── 1. ensureKindMapLoaded()          ← 품종코드→품종명 매핑 로드 (1회)
  │
  ├── 2. syncByUpkind("417000", ...)    ← 개 동기화
  │     ├── state="notice" (공고중) 페이지 순회
  │     │   ├── getAbandonedAnimals() → List<AnimalItem>
  │     │   └── 각 item → upsertAnimal()
  │     └── state="protect" (보호중) 페이지 순회
  │         ├── getAbandonedAnimals() → List<AnimalItem>
  │         └── 각 item → upsertAnimal()
  │
  ├── 3. syncByUpkind("422400", ...)    ← 고양이 동기화
  │     └── (개와 동일한 흐름)
  │
  └── 4. markExpiredAsAdopted()          ← 30일 초과 보호중 → 입양(추정) 보정
```

### 증분 동기화 (Incremental Sync)

**전체 데이터를 매번 가져오지 않는다.** 변경된 데이터만 가져온다.

```java
// AnimalSyncService.java
@Transactional
public SyncResult syncFromPublicApi(int days, Integer maxPages, String speciesFilter) {
    ensureKindMapLoaded();
    LocalDate endDate = LocalDate.now();
    LocalDate startDate = endDate.minusDays(days);   // 최근 N일만

    int added = 0, updated = 0;
    if (speciesFilter == null || "DOG".equalsIgnoreCase(speciesFilter)) {
        var c = syncByUpkind(DOG_CODE, startDate, endDate, maxPages);
        added += c[0]; updated += c[1];
    }
    if (speciesFilter == null || "CAT".equalsIgnoreCase(speciesFilter)) {
        var c = syncByUpkind(CAT_CODE, startDate, endDate, maxPages);
        added += c[0]; updated += c[1];
    }

    int corrected = markExpiredAsAdopted();
    return new SyncResult(added, updated, corrected);
}
```

`bgnde`/`endde` 파라미터가 **변경일(수정일) 기준**이므로, `days=7`이면 최근 7일 내 등록되거나 상태가 변경된 동물만 API가 반환한다.

```
전체 동기화: 수만 건 호출 → 느리고, API 호출 제한에 걸릴 수 있음
증분 동기화: 수백 건 호출 → 빠르고, API 부담 적음
```

### 페이지 순회 패턴

공공 API는 한 번에 최대 1000건까지 반환한다. 데이터가 많으면 페이지를 넘겨가며 호출해야 한다:

```java
// AnimalSyncService.java — syncByUpkind()
private int[] syncByUpkind(String upkind, LocalDate startDate,
                            LocalDate endDate, Integer maxPages) {
    int pageNo = 1;
    int numOfRows = 100;
    int added = 0, updated = 0;

    for (String state : new String[]{"notice", "protect"}) {
        pageNo = 1;
        while (true) {
            // 1. API 호출
            List<AnimalItem> items = publicApiService.getAbandonedAnimals(
                    null, null, upkind, state, startDate, endDate, pageNo, numOfRows);

            // 2. 빈 결과 → 이 상태의 모든 페이지 처리 완료
            if (items == null || items.isEmpty()) break;

            // 3. 각 항목 upsert
            for (AnimalItem item : items) {
                if (item.getDesertionNo() == null || item.getDesertionNo().isBlank()) {
                    log.warn("desertionNo 없음, 스킵");
                    continue;
                }
                try {
                    if (upsertAnimal(item)) added++;
                    else updated++;
                } catch (Exception e) {
                    log.warn("동물 upsert 실패 desertionNo={}: {}",
                        item.getDesertionNo(), e.getMessage());
                }
            }

            // 4. 마지막 페이지 체크
            if (items.size() < numOfRows) break;       // 요청 수보다 적게 왔으면 마지막
            if (maxPages != null && pageNo >= maxPages) break; // 최대 페이지 제한
            pageNo++;
        }
    }
    return new int[]{added, updated};
}
```

페이지 순회 종료 조건:

```
종료 조건 1: items가 빈 리스트    → 더 이상 데이터 없음
종료 조건 2: items.size() < 100  → 마지막 페이지 (100건 미만 반환)
종료 조건 3: pageNo >= maxPages  → 수동 실행 시 페이지 수 제한
```

### Upsert 로직

```java
// AnimalSyncService.java
/** @return true = 신규 추가, false = 기존 수정 */
private boolean upsertAnimal(AnimalItem item) {
    var existing = animalRepository.findByPublicApiAnimalId(item.getDesertionNo());
    if (existing.isPresent()) {
        updateAnimalFromApi(existing.get(), item);   // Update
        return false;
    }
    createAnimalFromApi(item);                       // Insert
    return true;
}
```

**`desertionNo`(유기번호)가 고유 식별자** 역할을 한다. 이미 DB에 같은 유기번호가 있으면 업데이트, 없으면 새로 생성한다.

```
공공 API 데이터                          우리 DB
┌──────────────────┐           ┌──────────────────┐
│ desertionNo: 001 │  ───→ DB에 001 있음 → UPDATE  │
│ desertionNo: 002 │  ───→ DB에 002 없음 → INSERT  │
│ desertionNo: 003 │  ───→ DB에 003 있음 → UPDATE  │
└──────────────────┘           └──────────────────┘
```

### DTO → Entity 변환 (핵심)

공공 API의 데이터 형식과 우리 DB의 형식은 다르다. 변환이 필요하다.

**종(Species) 매핑**:
```java
private Species mapSpecies(AnimalItem item) {
    if (CAT_CODE.equals(item.getUpKindCd())) return Species.CAT;     // "422400" → CAT
    if (DOG_CODE.equals(item.getUpKindCd())) return Species.DOG;     // "417000" → DOG
    // fallback: kindFullNm에서 추출
    String full = item.getKindFullNm();
    if (full != null && (full.contains("고양이") || full.contains("[고양이]"))) return Species.CAT;
    return Species.DOG;   // 기본값
}
```

**성별(Gender) 매핑**:
```java
private Gender mapGender(String sexCd) {
    if (sexCd == null) return null;
    return switch (sexCd.toUpperCase()) {
        case "M" -> Gender.MALE;
        case "F" -> Gender.FEMALE;
        default -> null;     // "Q" (미상) → null
    };
}
```

**상태(Status) 매핑**:
```java
private AnimalStatus mapStatus(String processState) {
    if (processState == null) return AnimalStatus.PROTECTED;
    if (processState.contains("입양")) return AnimalStatus.ADOPTED;
    if (processState.contains("임시보호")) return AnimalStatus.FOSTERING;
    return AnimalStatus.PROTECTED;    // 기본값
}
```

**나이 파싱** — 문자열에서 숫자 추출:
```java
private Integer parseAge(String age) {
    if (age == null || age.isBlank()) return null;
    try {
        String num = age.replaceAll("[^0-9]", "");    // "2022(년생)" → "2022"
        if (num.length() >= 4) {
            int year = Integer.parseInt(num.substring(0, 4));
            return LocalDate.now().getYear() - year;  // 2025 - 2022 = 3살
        }
        return Integer.parseInt(num);
    } catch (Exception e) {
        return null;
    }
}
```

**체중 기반 크기 추정**:
```java
private Size estimateSize(String weight) {
    if (weight == null) return Size.MEDIUM;
    try {
        String num = weight.replaceAll("[^0-9.]", "");   // "5.2(Kg)" → "5.2"
        double w = Double.parseDouble(num.isEmpty() ? "0" : num);
        if (w < 5) return Size.SMALL;
        if (w < 15) return Size.MEDIUM;
        return Size.LARGE;
    } catch (Exception e) {
        return Size.MEDIUM;
    }
}
```

**가명 생성** — 유기번호 해시로 고정 이름 배정:
```java
private static final String[] PLACEHOLDER_NAMES = {
    "똘이", "초코", "감자", "콩이", "나비", "링고", "토리", "초롱", "루니", "모카",
    "달이", "별이", "하늘이", "꼬미", "보리", "찰리", "해피", "코코", "두부", "깜이"
};

private String generateName(AnimalItem item) {
    String no = item.getDesertionNo();
    int idx = no != null ? Math.abs(no.hashCode() % PLACEHOLDER_NAMES.length) : 0;
    return PLACEHOLDER_NAMES[idx] + "(가명)";
}
```

왜 `hashCode()`를 쓰는가? **같은 유기번호는 항상 같은 이름**이 나온다. 동기화를 여러 번 해도 이름이 바뀌지 않는다 (결정적 - Deterministic).

### 만료 보정 — markExpiredAsAdopted()

공공 API의 기간 조회에 포함되지 않는 오래된 동물이 계속 "보호중"으로 남는 문제를 해결한다:

```java
private int markExpiredAsAdopted() {
    LocalDate cutoff = LocalDate.now().minusDays(EXPIRED_DAYS_THRESHOLD);  // 30일 전
    List<Animal> expired = animalRepository
        .findExpiredFromPublicApi(AnimalStatus.PROTECTED, cutoff);

    for (Animal a : expired) {
        a.setStatus(AnimalStatus.ADOPTED);   // 보호중 → 입양(추정)
        animalRepository.save(a);
    }
    return expired.size();
}
```

로직:
```
공공 API 유래 동물 + 등록일이 30일 초과 + 상태가 PROTECTED
  → ADOPTED로 변경 (실제로 입양되었을 가능성이 높으므로)
```

### 보호소 자동 생성 — findOrCreateShelter()

동물 데이터에 포함된 보호소 정보로 Shelter 엔티티를 자동 생성한다:

```java
private Shelter findOrCreateShelter(AnimalItem item) {
    String careNm = item.getCareNm();
    if (careNm == null || careNm.isBlank()) careNm = "미상";

    return shelterRepository.findFirstByName(careNm)
            .map(s -> {
                // 기존 보호소의 지역 정보가 없으면 주소에서 파싱해서 채움
                if (s.getRegionSido() == null && s.getAddress() != null) {
                    String[] r = AddressRegionParser.parse(s.getAddress());
                    s.setRegionSido(r[0]);
                    s.setRegionSigungu(r[1]);
                    shelterRepository.save(s);
                }
                return s;
            })
            .orElseGet(() -> createShelterFromApi(item));   // 없으면 새로 생성
}
```

### SyncResult — 동기화 결과 레코드

```java
public record SyncResult(int addedCount, int updatedCount, int statusCorrectedCount) {
    public int syncedCount() { return addedCount + updatedCount; }
}
```

Java 16의 `record`를 사용한다. 불변(Immutable) 데이터 객체로, 동기화 결과를 담아서 반환한다.

| 필드 | 의미 |
|------|------|
| `addedCount` | 새로 추가된 동물 수 |
| `updatedCount` | 기존 데이터가 수정된 동물 수 |
| `statusCorrectedCount` | 만료 → 입양(추정) 보정된 동물 수 |

> 📌 **핵심 정리**
> - **Upsert 패턴**: 고유 식별자(`desertionNo`)로 존재 여부 확인 → Insert 또는 Update
> - **증분 동기화**: 전체가 아닌 최근 N일 변경분만 가져온다
> - **페이지 순회**: 빈 결과 또는 요청 수 미만이 올 때까지 반복
> - **DTO → Entity 변환**: 문자열 파싱 (`"2022(년생)"` → 3살), 코드 매핑 (`"417000"` → DOG)
> - **만료 보정**: 30일 초과 보호중 동물 → ADOPTED(추정)으로 자동 변경
> - **record**: 동기화 결과를 불변 객체로 반환

> ⚠️ **자주 하는 실수**
> - `@Transactional` 없이 upsert를 실행한다 → 중간에 에러 나면 일부만 저장되어 데이터 불일치 발생
> - 고유 식별자 없이 insert만 한다 → 동기화할 때마다 중복 데이터가 쌓임
> - 외부 API 데이터 형식을 신뢰한다 → `"2022(년생)"` 같은 문자열을 정수로 바로 파싱하면 `NumberFormatException`
> - 개별 item 처리에서 예외를 catch하지 않는다 → 1건 실패로 전체 동기화가 중단됨
> - `hashCode()`로 가명 생성 시 음수가 나올 수 있다 → `Math.abs()` 필수

### 초보자를 위한 핵심 포인트: Upsert가 왜 중요한가

동기화를 이해하는 핵심 키워드는 **Upsert**다. 만약 Upsert 없이 매번 Insert만 하면?

```
1일차 동기화: 초코 INSERT → DB에 초코 1마리
2일차 동기화: 초코 INSERT → DB에 초코 2마리 (중복!)
3일차 동기화: 초코 INSERT → DB에 초코 3마리 (재앙!)

Upsert를 쓰면:
1일차 동기화: 초코 없음 → INSERT → DB에 초코 1마리
2일차 동기화: 초코 있음 → UPDATE → DB에 초코 1마리 (정보 갱신)
3일차 동기화: 초코 있음 → UPDATE → DB에 초코 1마리 (정보 갱신)
```

Upsert의 핵심은 **"이 데이터가 이미 있는가?"를 확인하는 고유 식별자** — 이 프로젝트에서는 `desertionNo`(유기번호)다.

### 초보자 체크리스트 — 4장을 읽고 나서 확인해보자

- [ ] Upsert의 의미를 설명할 수 있는가?
- [ ] 전체 동기화 vs 증분 동기화의 차이를 설명할 수 있는가?
- [ ] 공공 API의 `"2022(년생)"`을 어떻게 숫자 `3`(나이)으로 변환하는지 이해했는가?
- [ ] 페이지 순회가 언제 끝나는지(3가지 종료 조건) 설명할 수 있는가?
- [ ] 직접 [`AnimalSyncService.java`](../backend/src/main/java/com/dnproject/platform/service/AnimalSyncService.java)를 열어서 `upsertAnimal()` 메서드를 찾아봤는가?

---

# 5장. 스케줄링 — 자동 동기화

> **이 장에서 배우는 것**: `@Scheduled` 어노테이션으로 매일 새벽에 자동 동기화를 실행하는 방법, cron 표현식 읽는 법, 환경별로 기능을 켜고 끄는 방법을 배운다.
>
> **관련 소스코드 바로가기**
> - [`PublicApiSyncScheduler.java`](../backend/src/main/java/com/dnproject/platform/config/PublicApiSyncScheduler.java) — `@Scheduled`, `@ConditionalOnProperty`
> - [`DnPlatformApplication.java`](../backend/src/main/java/com/dnproject/platform/DnPlatformApplication.java) — `@EnableScheduling` 설정
> - [`application.yml`](../backend/src/main/resources/application.yml) — `sync-enabled`, `sync-cron` 설정

## Why — 왜 자동 동기화가 필요한가

관리자가 매일 아침 "동기화" 버튼을 수동으로 누르게 할 수는 없다. **스케줄러**가 정해진 시간에 자동으로 동기화를 실행해야 한다.

```
수동 동기화: 관리자가 기억해서 매일 클릭 → 까먹으면 데이터가 안 들어옴
자동 동기화: 매일 새벽 2시에 자동 실행 → 안정적, 일관적
```

Spring Boot에서는 `@Scheduled` 어노테이션으로 간단하게 스케줄링을 구현한다.

## How — @Scheduled와 cron 표현식

### cron 표현식 이해

```
0 0 2 * * *
│ │ │ │ │ │
│ │ │ │ │ └── 요일 (* = 매일)
│ │ │ │ └──── 월 (* = 매월)
│ │ │ └────── 일 (* = 매일)
│ │ └──────── 시 (2 = 새벽 2시)
│ └────────── 분 (0 = 정각)
└──────────── 초 (0 = 0초)
```

자주 쓰는 예시:

| cron | 의미 |
|------|------|
| `0 0 2 * * *` | 매일 새벽 2시 |
| `0 0 */6 * * *` | 6시간마다 |
| `0 30 9 * * MON-FRI` | 평일 오전 9시 30분 |
| `0 0 0 1 * *` | 매월 1일 자정 |

### 프로젝트의 스케줄러 전체 코드

```java
// PublicApiSyncScheduler.java
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "public-api.sync-enabled", havingValue = "true")
public class PublicApiSyncScheduler {

    private final AnimalSyncService animalSyncService;
    private final SyncHistoryService syncHistoryService;

    @Scheduled(cron = "${public-api.sync-cron:0 0 2 * * *}")
    public void syncFromPublicApi() {
        log.info("공공데이터 유기동물 스케줄 동기화 시작");
        try {
            var result = animalSyncService.syncDailySchedule();
            syncHistoryService.save(result, SyncTriggerType.AUTO, null, "ALL", null);
            log.info("공공데이터 유기동물 스케줄 동기화 완료: 신규={}, 수정={}, 만료보정={}",
                result.addedCount(), result.updatedCount(), result.statusCorrectedCount());
        } catch (Exception e) {
            log.error("공공데이터 유기동물 스케줄 동기화 실패", e);
            syncHistoryService.save(
                new AnimalSyncService.SyncResult(0, 0, 0),
                SyncTriggerType.AUTO, null, "ALL", e.getMessage());
        }
    }
}
```

코드가 짧지만, 중요한 개념이 여러 개 들어있다. 하나씩 뜯어보자.

### @ConditionalOnProperty — 기능 토글

```java
@ConditionalOnProperty(name = "public-api.sync-enabled", havingValue = "true")
```

이 어노테이션은 **"설정값이 true일 때만 이 Bean을 생성해라"** 라는 뜻이다.

```yaml
# application.yml
public-api:
  sync-enabled: ${PUBLIC_API_SYNC_ENABLED:false}   # 기본값: false (비활성)
```

| 설정값 | 동작 |
|--------|------|
| `sync-enabled: false` | `PublicApiSyncScheduler` Bean 자체가 **생성되지 않음** → 스케줄 없음 |
| `sync-enabled: true` | Bean이 생성되고 `@Scheduled`가 동작 |

왜 이렇게 하는가?

```
로컬 개발 환경: API 키가 없을 수도 있음 → sync-enabled=false
스테이징 환경: 테스트용 → sync-enabled=true
프로덕션 환경: 실 서비스 → sync-enabled=true
```

**환경별로 기능을 켜고 끌 수 있다.** 코드를 수정하지 않고 설정만 바꾸면 된다.

### @Scheduled — cron 표현식 외부화

```java
@Scheduled(cron = "${public-api.sync-cron:0 0 2 * * *}")
```

cron 표현식을 **코드에 하드코딩하지 않고** `application.yml`에서 읽는다.

```yaml
public-api:
  sync-cron: ${PUBLIC_API_SYNC_CRON:0 0 2 * * *}
```

```
${PUBLIC_API_SYNC_CRON:0 0 2 * * *}
  │                     │
  │                     └── 기본값: 매일 새벽 2시
  └── 환경 변수가 있으면 그걸 사용
```

프로덕션에서 실행 시간을 변경하고 싶으면 **코드 수정 없이** 환경 변수만 바꾸면 된다.

```bash
# 새벽 4시로 변경
PUBLIC_API_SYNC_CRON="0 0 4 * * *"
```

### 에러 처리 — 실패해도 다음 날 다시 실행

```java
try {
    var result = animalSyncService.syncDailySchedule();
    syncHistoryService.save(result, SyncTriggerType.AUTO, null, "ALL", null);
    // 성공 로그
} catch (Exception e) {
    log.error("공공데이터 유기동물 스케줄 동기화 실패", e);
    // 실패해도 이력은 저장 (에러 메시지 포함)
    syncHistoryService.save(
        new AnimalSyncService.SyncResult(0, 0, 0),
        SyncTriggerType.AUTO, null, "ALL", e.getMessage());
}
```

핵심: **실패해도 예외를 삼킨다(catch).** `@Scheduled` 메서드에서 예외가 밖으로 나가면 스케줄러 자체가 멈출 수 있다.

```
성공 시: 결과 저장 + 성공 로그
실패 시: 에러 이력 저장 + 에러 로그 → 다음 실행 시간에 다시 시도
```

### SyncTriggerType — 실행 출처 구분

```java
// 자동 동기화: AUTO
syncHistoryService.save(result, SyncTriggerType.AUTO, ...);

// 수동 동기화: MANUAL (6장에서 다룸)
syncHistoryService.save(result, SyncTriggerType.MANUAL, ...);
```

이력에 실행 출처를 기록하면 나중에 "이 동기화는 자동이었나 수동이었나" 구분할 수 있다.

### @Scheduled 사용 전제 조건

`@Scheduled`가 동작하려면 메인 애플리케이션 또는 설정 클래스에 `@EnableScheduling`이 있어야 한다:

```java
@SpringBootApplication
@EnableScheduling    // ← 이것이 있어야 @Scheduled가 동작
public class PlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(PlatformApplication.class, args);
    }
}
```

## What — 전체 자동 동기화 흐름

```
매일 새벽 2시 (cron 트리거)
  │
  ├── sync-enabled=false?  → Bean 자체가 없으므로 아무 일도 안 일어남
  │
  └── sync-enabled=true
       │
       ├── syncDailySchedule() 호출
       │   ├── 최근 1일 변경분 + 개/고양이 모두 동기화
       │   └── 30일 초과 보호중 → 입양(추정) 보정
       │
       ├── 성공 → SyncHistory 저장 (triggerType=AUTO, errorMessage=null)
       │
       └── 실패 → SyncHistory 저장 (triggerType=AUTO, errorMessage=에러내용)
```

> 📌 **핵심 정리**
> - `@Scheduled(cron = "...")` 으로 정해진 시간에 메서드를 자동 실행
> - cron 표현식은 `application.yml`에서 읽어 **외부화** → 코드 수정 없이 시간 변경
> - `@ConditionalOnProperty`로 **기능 토글** → 환경별로 켜고 끄기
> - `@Scheduled` 메서드 안에서 예외를 반드시 catch → 스케줄러 멈춤 방지
> - 성공/실패 모두 이력을 DB에 저장 → 나중에 "언제 동기화가 됐고, 실패했는지" 추적 가능

> ⚠️ **자주 하는 실수**
> - `@EnableScheduling`을 빼먹어서 `@Scheduled`가 아예 동작하지 않는다
> - `@Scheduled` 메서드에서 예외를 throw한다 → 스케줄러가 멈출 수 있음
> - cron 표현식을 코드에 하드코딩한다 → 시간 변경 시 코드 수정 + 재배포 필요
> - `@ConditionalOnProperty` 없이 스케줄러를 만든다 → 로컬 개발 시 불필요한 API 호출 발생
> - Spring의 cron은 6자리 (`초 분 시 일 월 요일`), Linux cron은 5자리 (`분 시 일 월 요일`) — 혼동 주의

### 초보자를 위한 비유: @Scheduled = 알람시계

```
@Scheduled(cron = "0 0 2 * * *")
→ "매일 새벽 2시에 알람이 울려서 동기화를 실행해라"

@ConditionalOnProperty(name = "sync-enabled", havingValue = "true")
→ "알람시계의 전원 스위치. false면 알람시계 자체가 없다"

application.yml의 sync-cron 설정
→ "알람 시간을 외부에서 바꿀 수 있다 (코드 수정 없이!)"
```

### 초보자 체크리스트 — 5장을 읽고 나서 확인해보자

- [ ] cron 표현식 `0 0 2 * * *`을 한국어로 읽을 수 있는가? (매일 새벽 2시 0분 0초)
- [ ] Spring cron이 6자리, Linux cron이 5자리인 차이를 이해했는가?
- [ ] `@ConditionalOnProperty`가 왜 필요한지 (로컬 개발 시 불필요한 API 호출 방지) 설명할 수 있는가?
- [ ] `@Scheduled` 메서드에서 예외를 반드시 catch해야 하는 이유를 알겠는가?

---

# 6장. 관리자 수동 동기화 API

> **이 장에서 배우는 것**: 자동 동기화만으로는 부족한 상황(첫 배포, 긴급 업데이트, 특정 종만 동기화)에서 관리자가 직접 실행하는 수동 동기화 API를 배운다.
>
> **관련 소스코드 바로가기**
> - [`AdminAnimalController.java`](../backend/src/main/java/com/dnproject/platform/controller/AdminAnimalController.java) — 수동 동기화 + 이력 조회 엔드포인트
> - [`SyncHistory.java`](../backend/src/main/java/com/dnproject/platform/domain/SyncHistory.java) — 동기화 이력 Entity
> - [`SyncHistoryService.java`](../backend/src/main/java/com/dnproject/platform/service/SyncHistoryService.java) — 이력 저장/조회 서비스
> - [`admin.ts`](../frontend/src/api/admin.ts) — 프론트 관리자 API 모듈 (timeout 3분 설정)
>
> **관련 문서**: [API 명세서](./API_SPEC.md) — `POST /api/admin/animals/sync-from-public-api` 상세 스펙

## Why — 왜 수동 동기화가 필요한가

자동 동기화(5장)가 있는데 왜 수동 동기화도 필요한가?

| 상황 | 자동 동기화로 해결 가능? |
|------|------------------------|
| 서비스 첫 시작, DB가 비어있다 | ❌ 내일 새벽 2시까지 기다려야 함 |
| 특정 종(개만, 고양이만) 동기화하고 싶다 | ❌ 자동은 항상 둘 다 |
| 30일치를 한번에 가져오고 싶다 | ❌ 자동은 1일치만 |
| 긴급하게 데이터를 최신화해야 한다 | ❌ 예정된 시간까지 기다려야 함 |
| 동기화 실패 후 수동으로 재시도 | ❌ 자동은 다음 날 실행 |

**수동 동기화 = 관리자가 파라미터를 지정해서 원하는 시점에 실행**하는 것이다.

## How — AdminAnimalController 분석

### 수동 동기화 엔드포인트

```java
// AdminAnimalController.java
@Tag(name = "Admin - Animal", description = "관리자 동물 API")
@RestController
@RequestMapping("/api/admin/animals")
@RequiredArgsConstructor
public class AdminAnimalController {

    private final AnimalService animalService;
    private final PublicApiService publicApiService;
    private final SyncHistoryService syncHistoryService;

    @Operation(summary = "공공데이터 유기동물 동기화")
    @PostMapping("/sync-from-public-api")
    public ApiResponse<Map<String, Object>> syncFromPublicApi(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(required = false) Integer maxPages,
            @RequestParam(required = false) String species) {

        boolean apiKeyConfigured = publicApiService.isApiKeyConfigured();

        try {
            var result = animalService.syncFromPublicApiWithStatus(days, maxPages, species);

            // 성공 이력 저장
            syncHistoryService.save(result, SyncTriggerType.MANUAL,
                days, species != null ? species : "ALL", null);

            return ApiResponse.success("동기화 완료", Map.of(
                "addedCount", result.addedCount(),
                "updatedCount", result.updatedCount(),
                "syncedCount", result.syncedCount(),
                "statusCorrectedCount", result.statusCorrectedCount(),
                "days", days,
                "species", species != null ? species : "ALL",
                "apiKeyConfigured", apiKeyConfigured
            ));

        } catch (Exception e) {
            // 실패 이력도 저장
            syncHistoryService.save(
                new AnimalSyncService.SyncResult(0, 0, 0),
                SyncTriggerType.MANUAL, days,
                species != null ? species : "ALL", e.getMessage());
            throw e;   // GlobalExceptionHandler가 처리
        }
    }
```

이 엔드포인트의 특징:

**1. POST 메서드를 사용한다**

동기화는 서버 상태를 변경하는(DB에 데이터를 쓰는) 작업이므로 POST가 적합하다. GET으로 만들면 브라우저 주소창에서 실수로 호출하거나, 크롤러가 호출할 수 있다.

**2. 파라미터로 동기화 범위를 조절할 수 있다**

| 파라미터 | 기본값 | 설명 |
|---------|--------|------|
| `days` | 7 | 최근 N일치 데이터 동기화 |
| `maxPages` | null (제한 없음) | 최대 페이지 수 제한 |
| `species` | null (전체) | `DOG`, `CAT`, 또는 null(전체) |

**3. 성공/실패 모두 이력을 저장한다**

성공하면 결과와 함께 `SyncTriggerType.MANUAL`로 저장. 실패하면 에러 메시지와 함께 저장하고 예외를 다시 throw한다.

### 동기화 이력 조회 엔드포인트

```java
// AdminAnimalController.java
@Operation(summary = "동기화 이력 목록 (자동/수동, 추가·수정·삭제·보정 건수)")
@GetMapping("/sync-history")
public ApiResponse<PageResponse<SyncHistoryResponse>> getSyncHistory(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {

    var p = syncHistoryService.getHistory(PageRequest.of(page, size));

    var content = p.getContent().stream()
            .map(h -> new SyncHistoryResponse(
                    h.getId(),
                    h.getRunAt().toString(),
                    h.getTriggerType().name(),
                    h.getAddedCount(),
                    h.getUpdatedCount(),
                    h.getDeletedCount(),
                    h.getCorrectedCount(),
                    h.getErrorMessage(),
                    h.getDaysParam(),
                    h.getSpeciesFilter()
            ))
            .toList();

    return ApiResponse.success("OK", PageResponse.<SyncHistoryResponse>builder()
            .content(content)
            .page(p.getNumber())
            .size(p.getSize())
            .totalElements(p.getTotalElements())
            .totalPages(p.getTotalPages())
            .first(p.isFirst())
            .last(p.isLast())
            .build());
}
```

Entity(`SyncHistory`)를 직접 반환하지 않고, **inner record**로 변환한다:

```java
public record SyncHistoryResponse(
    Long id,
    String runAt,
    String triggerType,         // "AUTO" 또는 "MANUAL"
    int addedCount,
    int updatedCount,
    int deletedCount,
    int correctedCount,
    String errorMessage,        // null이면 성공
    Integer daysParam,          // 수동 시 지정한 days
    String speciesFilter        // "ALL", "DOG", "CAT"
) {}
```

### SyncHistory Entity — 이력 저장 구조

```java
// SyncHistory.java
@Entity
@Table(name = "sync_history", indexes = {
    @Index(name = "idx_sync_history_run_at", columnList = "run_at")
})
@Builder
public class SyncHistory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_at", nullable = false)
    private Instant runAt;                      // 실행 시각

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 20)
    private SyncTriggerType triggerType;         // AUTO / MANUAL

    private int addedCount;                      // 신규 추가 수
    private int updatedCount;                    // 수정 수
    private int deletedCount;                    // 삭제 수
    private int correctedCount;                  // 만료 보정 수

    @Column(name = "error_message", length = 1000)
    private String errorMessage;                 // null이면 성공

    private Integer daysParam;                   // 수동 실행 시 days
    private String speciesFilter;                // 종 필터
}
```

`run_at`에 인덱스를 걸었다 → 최신 이력을 빠르게 조회하기 위함.

### SyncHistoryService — 이력 저장 서비스

```java
// SyncHistoryService.java
@Service
@RequiredArgsConstructor
public class SyncHistoryService {

    private final SyncHistoryRepository syncHistoryRepository;

    @Transactional
    public SyncHistory save(AnimalSyncService.SyncResult result,
                            SyncTriggerType triggerType,
                            Integer daysParam, String speciesFilter,
                            String errorMessage) {
        SyncHistory history = SyncHistory.builder()
                .runAt(Instant.now())
                .triggerType(triggerType)
                .addedCount(result.addedCount())
                .updatedCount(result.updatedCount())
                .deletedCount(0)
                .correctedCount(result.statusCorrectedCount())
                .errorMessage(errorMessage != null && errorMessage.length() > 1000
                    ? errorMessage.substring(0, 1000) : errorMessage)
                .daysParam(daysParam)
                .speciesFilter(speciesFilter)
                .build();
        return syncHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public Page<SyncHistory> getHistory(Pageable pageable) {
        return syncHistoryRepository.findAllByOrderByRunAtDesc(pageable);
    }
}
```

`errorMessage`를 1000자로 잘라서 저장한다 → DB 컬럼 길이 제한(1000) 초과 방지.

## What — 프론트엔드 연동

### 프론트엔드 API 모듈

```typescript
// frontend/src/api/admin.ts
export const adminApi = {
  /** 공공데이터 유기동물 동기화 (장시간 소요 → 타임아웃 3분) */
  syncFromPublicApi: (params?: { days?: number; maxPages?: number; species?: string }) =>
    axiosInstance.post<ApiResponse<{
      addedCount: number;
      updatedCount: number;
      syncedCount: number;
      statusCorrectedCount: number;
      days: number;
      species: string;
      apiKeyConfigured?: boolean;
    }>>('/admin/animals/sync-from-public-api', null, {
      params,
      timeout: 180_000    // ← 3분 타임아웃
    }),

  /** 동기화 이력 목록 */
  getSyncHistory: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<PageResponse<SyncHistoryItem>>>(
      '/admin/animals/sync-history',
      { params: { page, size } }
    ),
};
```

**주의할 점: `timeout: 180_000` (3분)**

동기화는 외부 API를 수십~수백 번 호출하므로 시간이 오래 걸린다. 일반 API 호출(수 초)과 달리 **분 단위**로 걸릴 수 있다. 기본 Axios 타임아웃(보통 30초)이면 중간에 끊긴다.

```
일반 API 호출: 수백 ms ~ 수 초 → 기본 타임아웃 OK
동기화 API 호출: 수십 초 ~ 수 분 → 타임아웃을 늘려야 함
```

### TypeScript 이력 타입

```typescript
// frontend/src/api/admin.ts
export interface SyncHistoryItem {
  id: number;
  runAt: string;
  triggerType: 'AUTO' | 'MANUAL';
  addedCount: number;
  updatedCount: number;
  deletedCount: number;
  correctedCount: number;
  errorMessage: string | null;
  daysParam: number | null;
  speciesFilter: string | null;
}
```

TypeScript의 **유니온 타입** `'AUTO' | 'MANUAL'`이 백엔드의 `SyncTriggerType` enum에 대응한다.

### 전체 흐름 — 수동 동기화

```
[관리자 프론트엔드]
  │
  │ POST /api/admin/animals/sync-from-public-api?days=7&species=DOG
  │ (timeout: 180초)
  │
  ▼
[AdminAnimalController]
  │
  │ animalService.syncFromPublicApiWithStatus(7, null, "DOG")
  │
  ▼
[AnimalSyncService]
  │
  │ syncByUpkind("417000", 7일 전, 오늘, null)
  │   ├── publicApiService.getAbandonedAnimals(state=notice, page=1)
  │   ├── publicApiService.getAbandonedAnimals(state=notice, page=2)
  │   ├── ...
  │   ├── publicApiService.getAbandonedAnimals(state=protect, page=1)
  │   └── ...
  │ markExpiredAsAdopted()
  │
  ▼
[PublicApiService] → [공공데이터포털 API]
```

```
응답:
{
  "status": "success",
  "message": "동기화 완료",
  "data": {
    "addedCount": 42,
    "updatedCount": 15,
    "syncedCount": 57,
    "statusCorrectedCount": 3,
    "days": 7,
    "species": "DOG",
    "apiKeyConfigured": true
  }
}
```

### 전체 흐름 — 동기화 이력 조회

```
[관리자 프론트엔드]
  │
  │ GET /api/admin/animals/sync-history?page=0&size=20
  │
  ▼
[AdminAnimalController]
  │
  │ syncHistoryService.getHistory(PageRequest.of(0, 20))
  │
  ▼
[SyncHistoryRepository]
  │ findAllByOrderByRunAtDesc(pageable)
  │
  ▼
응답:
{
  "status": "success",
  "data": {
    "content": [
      {
        "id": 15,
        "runAt": "2025-01-07T02:00:01Z",
        "triggerType": "AUTO",
        "addedCount": 28,
        "updatedCount": 12,
        "correctedCount": 5,
        "errorMessage": null
      },
      {
        "id": 14,
        "runAt": "2025-01-06T14:30:22Z",
        "triggerType": "MANUAL",
        "addedCount": 42,
        "updatedCount": 15,
        "correctedCount": 3,
        "errorMessage": null,
        "daysParam": 7,
        "speciesFilter": "DOG"
      }
    ],
    "totalElements": 15,
    "totalPages": 1
  }
}
```

관리자는 이 이력을 보고 **"오늘 자동 동기화가 잘 됐는지"**, **"에러가 있었는지"** 를 확인할 수 있다.

> 📌 **핵심 정리**
> - 수동 동기화 API: `POST /api/admin/animals/sync-from-public-api`
> - 파라미터로 `days`, `maxPages`, `species`를 조절 가능
> - 성공/실패 모두 `SyncHistory`에 이력 저장
> - `SyncTriggerType` enum으로 자동(AUTO)/수동(MANUAL) 구분
> - 프론트엔드에서 타임아웃을 3분(180초)으로 늘려야 함
> - 이력 조회 API로 동기화 결과를 관리자가 모니터링

> ⚠️ **자주 하는 실수**
> - 수동 동기화 API를 GET으로 만든다 → 상태 변경 작업은 POST/PUT으로 해야 안전
> - 프론트엔드 타임아웃을 늘리지 않는다 → 동기화 중간에 연결이 끊겨서 "실패"로 보이지만 서버에서는 계속 실행 중
> - 이력을 저장하지 않는다 → 문제 발생 시 "언제 마지막으로 동기화했는지" 추적 불가능
> - `errorMessage`를 그대로 저장한다 → 스택트레이스가 수천 자일 수 있으므로 길이 제한 필수
> - `/api/admin/` 경로에 권한 체크를 빼먹는다 → 일반 사용자가 동기화를 실행할 수 있게 됨 (SecurityConfig에서 ADMIN 권한 필요)

### 초보자 체크리스트 — 6장을 읽고 나서 확인해보자

- [ ] 수동 동기화가 필요한 상황 3가지를 말할 수 있는가?
- [ ] 프론트의 타임아웃을 3분(180초)으로 늘리는 이유를 이해했는가?
- [ ] `SyncTriggerType.AUTO`와 `SyncTriggerType.MANUAL`의 차이를 설명할 수 있는가?
- [ ] `SyncHistory` Entity에 `errorMessage`가 null이면 성공, 값이 있으면 실패인 이유를 이해했는가?
- [ ] 직접 [`admin.ts`](../frontend/src/api/admin.ts)를 열어서 `syncFromPublicApi`의 `timeout` 설정을 확인했는가?

---

# 부록: 전체 아키텍처 정리

## 클래스 관계도

```
                            application.yml
                         ┌──────────────────┐
                         │ public-api:       │
                         │   service-key     │
                         │   base-url        │
                         │   sync-enabled    │
                         │   sync-cron       │
                         └────────┬─────────┘
                                  │ @Value
                                  ▼
[공공데이터포털] ◀────── PublicApiService ──────▶ WebClient
  (외부 서버)           (HTTP 호출 + JSON 파싱)
                                  │
                    List<AnimalItem> 반환
                                  │
                                  ▼
                         AnimalSyncService
                         (DTO→Entity 변환)
                         (Upsert 로직)
                         (만료 보정)
                                  │
                    SyncResult 반환│
               ┌──────────────────┼──────────────────┐
               │                  │                  │
               ▼                  ▼                  ▼
   PublicApiSyncScheduler  AdminAnimalController  SyncHistoryService
   (@Scheduled, AUTO)      (REST API, MANUAL)     (이력 저장/조회)
                                                       │
                                                       ▼
                                                  SyncHistory (Entity)
                                                  sync_history (Table)
```

## 데이터 흐름

```
1. 공공 API 호출
   PublicApiService.getAbandonedAnimals()
   → JSON 응답 → parseAnimalItems() → List<AnimalItem>

2. 데이터 변환 + 저장
   AnimalSyncService.syncByUpkind()
   → 각 AnimalItem에 대해 upsertAnimal()
     → findByPublicApiAnimalId() 로 존재 확인
     → 있으면 updateAnimalFromApi() / 없으면 createAnimalFromApi()
     → mapSpecies(), mapGender(), mapStatus(), parseAge(), estimateSize() 등 변환

3. 만료 보정
   AnimalSyncService.markExpiredAsAdopted()
   → 30일 초과 + PROTECTED → ADOPTED 변경

4. 이력 저장
   SyncHistoryService.save()
   → SyncHistory 엔티티 생성 → DB 저장

5. 실행 트리거
   - 자동: PublicApiSyncScheduler (@Scheduled cron)
   - 수동: AdminAnimalController (POST /api/admin/animals/sync-from-public-api)
```

## 기술 스택 정리

| 기술 | 용도 | 파트 |
|------|------|------|
| `WebClient` | 외부 HTTP 호출 | 3장 |
| `UriComponentsBuilder` | URL 안전한 구성 | 3장 |
| `ObjectMapper` | JSON 수동 파싱 | 3장 |
| `@JsonProperty`, `@JsonAlias` | JSON ↔ Java 매핑 | 3장 |
| `@Transactional` | 동기화 원자성 보장 | 4장 |
| `@Scheduled` | cron 기반 자동 실행 | 5장 |
| `@ConditionalOnProperty` | 기능 토글 | 5장 |
| `record` | 불변 결과 객체 | 4장, 6장 |
| `@Value` | 설정값 주입 | 2장 |
| `@PostConstruct` | 초기화 시 확인 로직 | 2장 |

---

## 파트 C 전체 요약 — 초보자를 위한 핵심 정리

| 장 | 한 문장 요약 |
|---|------------|
| 1장 | 외부 API는 **남의 서버를 호출**하는 것이므로 방어적 코딩이 필수다. |
| 2장 | API 키는 **환경 변수로 관리**하고, `.env` 파일은 절대 Git에 올리지 않는다. |
| 3장 | `WebClient`로 외부 API를 호출하고, 공공 API의 **비일관적 응답을 수동 파싱**한다. |
| 4장 | **Upsert 패턴**으로 중복 없이 동기화하고, `"2022(년생)"` 같은 문자열을 파싱해서 변환한다. |
| 5장 | `@Scheduled(cron)`으로 **매일 자동 동기화**하고, `@ConditionalOnProperty`로 환경별 토글한다. |
| 6장 | 관리자가 **수동으로 동기화**할 수 있는 API를 제공하고, 모든 실행 이력을 DB에 저장한다. |

---

## 다음 학습 가이드

| 순서 | 문서 | 내용 |
|------|------|------|
| **이전** | [파트 B: 실전 API 개발](./STUDY_PART_B_실전_API_개발.md) | RESTful 설계, Entity↔DTO, 페이지네이션 |
| **현재** | **파트 C: 외부 API 연동** | 공공데이터 API, WebClient, 동기화, 스케줄링 |
| **다음** | [파트 D: 카카오지도 연동](./STUDY_PART_D_카카오지도_연동과_종합비교.md) | 프론트에서 외부 API 호출, 두 패턴 비교 |
| | [파트 E: Terraform 인프라](./STUDY_PART_E_Terraform_인프라_생성.md) | AWS 인프라 코드(IaC) |
| | [파트 F: CI/CD와 환경변수](./STUDY_PART_F_CICD와_환경변수.md) | GitHub Actions, 배포 자동화 |
| | [파트 G: 안정화와 트러블슈팅](./STUDY_PART_G_안정화와_트러블슈팅.md) | 운영 중 문제 해결 |

> **참고 문서 바로가기**
> - [API 명세서](./API_SPEC.md) — 전체 엔드포인트 상세 스펙
> - [DB 스키마](./DATABASE.md) — 테이블 구조, ERD
> - [공공 API 참고자료](./PUBLIC_API_REFERENCES.md) — data.go.kr API 상세
> - [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md) — 배포 전 확인사항

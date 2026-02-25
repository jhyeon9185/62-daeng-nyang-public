# 프로젝트 구조 분석 보고서 (스킬 기반)

본 보고서는 사용자의 요청에 따라 `https://skills.sh/` 및 로컬 스킬 가이드를 활용하여 현재 프로젝트(`DN_project01`)의 구조를 분석하고, 특히 서비스 레이어에서 매퍼(Mapper) 레이어를 분리하는 것에 대한 타당성을 검토한 결과입니다.

## 1. 사용된 스킬 및 참조 가이드

분석을 위해 다음과 같은 스킬 및 문서를 참조했습니다:

| 출처 | 스킬/문서명 | 핵심 권장 사항 |
| :--- | :--- | :--- |
| **skills.sh** | `unit-test-mapper-converter` | 매핑 로직을 별도 클래스로 분리하여 독립적 테스트 보장 |
| **skills.sh** | `spring-boot-crud-patterns` | 서비스는 비즈니스 흐름 제어, 매핑은 전용 컴포넌트 담당 |
| **skills.sh** | `clean-architecture` | 계층 간 경계에서 데이터 변환을 담당하는 Adapter/Mapper 격리 |
| **로컬 스킬** | [spring-api.md](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/.claude/skills/spring-api.md) | DTO 내부에 static factory 메서드(`from`)를 두는 패턴 제시 |
| **프로젝트 문서** | `스프링부트_Gemini.md` | 쇼핑몰 아키텍처 기반의 Service 내 mapping 패턴 (현재 구조의 모태) |

---

## 2. 현재 구조 분석 (As-Is)

현재 [AdoptionService](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AdoptionService.java#26-199), [AnimalService](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AnimalService.java#24-246) 등 주요 서비스의 구조는 다음과 같습니다:

- **데이터 변환 위치**: 서비스 클래스 내부의 `private` 메서드 ([toResponse](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AnimalService.java#211-245), [toPageResponse](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AnimalService.java#56-67) 등)
- **장점**: 직관적이며, 소규모 프로젝트에서 별도의 클래스 없이 빠르게 개발 가능.
- **단점 (스킬 기반 분석)**:
    - **서비스 비대화**: 비즈니스 로직보다 매핑 로직이 더 많은 비중을 차지하게 됨 (예: [AnimalService](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AnimalService.java#24-246)의 [toResponse](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AnimalService.java#211-245)는 단순 필드 복사임에도 코드가 긺).
    - **중복 발생**: 여러 서비스에서 동일한 엔티티를 DTO로 변환할 때(예: [AdoptionService](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AdoptionService.java#26-199)에서 [Animal](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AnimalService.java#24-246) 정보를 포함할 때), 매핑 로직이 중복될 가능성이 큼.
    - **테스트 어려움**: 매핑 로직만 따로 떼어내어 단위 테스트하기 어려움.

---

## 3. 매퍼(Mapper) 분리 타당성 검토

`https://skills.sh/`의 스킬들이 제안하는 **매퍼 분리**는 다음과 같은 이유로 강력히 권장됩니다.

### A. 관심사 분리 (Separation of Concerns)
`spring-boot-crud-patterns` 스킬에 따르면, 서비스는 "무엇(What)"을 할지 결정하고 매퍼는 "어떻게 변환할지(How)"를 담당해야 합니다. 서비스 코드가 훨씬 깔끔해지며 비즈니스 로직에만 집중할 수 있습니다.

### B. 재사용성 및 유지보수성
`clean-architecture` 스킬에서는 계층 간 데이터 이동 시 전용 매퍼를 사용하면, DTO 구조가 바뀌어도 서비스 로직을 건드리지 않고 매퍼만 수정하면 됩니다. 또한, [Animal](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AnimalService.java#24-246) 엔티티를 [AdoptionService](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AdoptionService.java#26-199)에서도 변환해야 할 때 `AnimalMapper`를 주입받아 즉시 재사용할 수 있습니다.

### C. 테스트 용이성
`unit-test-mapper-converter` 스킬이 강조하듯, 복잡한 매핑(예: 날짜 포맷팅, Enum 변환 등)이 포함된 경우 매퍼 클래스만 따로 테스트하여 데이터 정합성을 보장할 수 있습니다.

---

## 4. 최종 제안 (To-Be)

스킬 탐색 결과를 종합해 볼 때, **서비스의 특정 부분을 매퍼로 분리하는 것은 매우 타당한 방향**입니다. 

### 제안하는 개선 방향
1. **Mapper 레이어 신설**: `com.dnproject.platform.mapper` 패키지 생성.
2. **수동 매퍼 또는 MapStruct 도입**:
    - **수동 매퍼**: `@Component` 클래스로 작성하여 스프링 빈으로 관리 (현재 프로젝트 규모에 적합).
    - **MapStruct**: 코드 생성기를 사용하여 자동 변환 (대규모 프로젝트 및 반복 작업 감소에 유리).
3. **DTO 통합 관리**: 로컬 스킬 [spring-api.md](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/.claude/skills/spring-api.md)에서 제안하는 DTO 내부 `from()` 메서드 방식도 고려해 볼 수 있으나, 서비스 간 재사용성을 고려한다면 **별도 Mapper 클래스 방식**이 더 확장성이 좋습니다.

> [!TIP]
> **AdoptionService 분석 결과**: 현재 [toResponse](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AnimalService.java#211-245) 메서드는 [Animal](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/service/AnimalService.java#24-246) 정보까지 복합적으로 매핑하고 있습니다. 이를 `AdoptionMapper`로 분리하면 서비스 코드를 약 30% 이상 줄일 수 있을 것으로 보입니다.

---

## 5. 추가 기반 코드 및 아키텍처 개선점

`skills.sh`의 모범 사례(Clean Architecture, REST API Standards 등)와 현재 코드베이스를 비교 분석한 결과, 매퍼 분리 외에도 **성능 및 유지보수성 측면에서 중요한 개선점 두 가지**가 발견되었습니다.

### A. 데이터 조회 시 N+1 문제 (성능 최적화 필요)
- **현상**: `AnimalService.toResponse()`, `AdoptionService.toResponse()` 등의 매핑 과정에서 지연 로딩(Lazy Loading)으로 설정된 연관 객체(`animal.getShelter()`, `adoption.getUser()`, `adoption.getAnimal()`)의 데이터를 사용합니다. 하지만 현재 Repository의 조회 메서드는 단순 `JOIN`만 수행하거나 기본 파생 쿼리를 사용하고 있어, 목록(Page) 조회 단위 시 **(조회된 데이터 수 N + 1) 번의 추가 쿼리가 발생**합니다.
- **해결 방안**: 리포지토리 계층에서 `@EntityGraph`를 사용하거나 `JOIN FETCH` 구문을 명시하여 연관된 엔티티를 단일 쿼리로 최적화된 조인을 통해 가져와야 합니다.

### B. 동적 쿼리 작성 방식 개선 (QueryDSL 도입)
- **현상**: `AnimalRepository.findWithFilters()`나 `BoardRepository.findWithSearch()` 등의 메서드에서 `(:search IS NULL OR a.name LIKE ...)` 와 같은 방식으로 동적 조회(Dynamic Query) 조건을 JPQL 내부에 하드코딩하고 있습니다. 이는 쿼리가 복잡해질수록 유지보수가 어렵고 실행 계획 최적화에 불리합니다.
- **해결 방안**: 프로젝트 모태 구조 가이드(`스프링부트_Gemini.md`)에서 제안한 바와 같이, 다중 필터 조건이 많은 엔드포인트에는 **QueryDSL**을 도입하여 동적 쿼리를 타입 세이프(Type-Safe)하고 가독성 높게 코드로 구성할 것을 권장합니다.

> **종합 결론**: 
> [GlobalExceptionHandler](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/exception/GlobalExceptionHandler.java#22-133)를 통한 전역 예외 처리, [SecurityConfig](file:///Volumes/Samsung%20X5/dev_study/DN_project/DN_project01/backend/src/main/java/com/dnproject/platform/config/SecurityConfig.java#18-111) 기반의 Stateless 인증 등 기초 구조는 매우 모범적입니다. 
> 차후 리팩토링 단계에서는 **1) Mapper 분리로 서비스 책임 단일화**, **2) JOIN FETCH 및 EntityGraph를 활용한 N+1 쿼리 최적화**, **3) QueryDSL 도입을 통한 동적 쿼리 개선** 3가지를 중점적으로 추진하는 것을 건의합니다.

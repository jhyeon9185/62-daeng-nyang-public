# 프로젝트 구조 및 개선 사항 분석 연구 (Phase 1)

## 1. 개요
사용자의 `analysis_report.md`와 현재 코드베이스를 기반으로 애플리케이션의 핵심 개선 과제인 **1) Mapper 분리**, **2) N+1 문제 해결(JOIN FETCH/EntityGraph 활용)**, **3) 동적 쿼리 개선(QueryDSL 도입)**에 대한 심층적인 분석을 진행했습니다. 본 문서는 이전 `dn_platform` 조사를 대체하는 최신의 연구 보고서입니다.

## 2. 코드베이스 분석 대상 및 결과

### 2.1 매퍼(Mapper) 분리 문제
- **대상 파일**: `AnimalService.java`, `AdoptionService.java`
- **현상**:
  - `AnimalService.toResponse()`와 `AdoptionService.toResponse()` 등 엔티티를 DTO로 변환하는 로직이 서비스 레이어 내부에 깊숙이 자리 잡고 있습니다.
  - 이로 인해 서비스 코드가 지나치게 길어지며, 단일 책임 원칙(SRP)을 위배하는 상황입니다. (예: `AnimalService` 전체 246줄 중 매핑 코드가 방대함)
  - 연관 객체(Shelter, User 등)의 안전한 null 체크 처리가 반복적으로 하드코딩되어 유지보수성이 떨어집니다.
- **결론**: 변환을 전담하는 `AnimalMapper`, `AdoptionMapper` 등의 별도 컴포넌트(Component) 클래스 생성이 강하게 요구됩니다.

### 2.2 N+1 문제 (성능 최적화)
- **대상 파일**: `AnimalRepository.java`, `AdoptionRepository.java`
- **현상**:
  - `AnimalRepository`의 지연 로딩(Lazy Loading)되는 `Shelter` 데이터에 접근하면서 N번의 추가 조회 쿼리가 발생합니다. 
  - `AdoptionService.getAllForAdmin()` 등에서도 `adoption.getUser()` 및 `adoption.getAnimal().getShelter()` 참조 시 N+1 쿼리가 발생 구조적 결함이 존재합니다.
- **결론**: JpaRepository 메서드에 `@EntityGraph(attributePaths = {"shelter"})`를 적용하거나 명시적으로 `JOIN FETCH` 구문을 추가하여 단일 쿼리로 최적화된 조인을 수행해야 합니다.

### 2.3 동적 쿼리 (Dynamic Query) 작성 방식
- **대상 파일**: `AnimalRepository.java`
- **현상**:
  - `findWithFilters` 등의 메서드에서 `@Query`를 통해 길고 복잡한 JPQL 문자열을 구성하고 있습니다. 하드코딩된 동적 필터링을 수행하고 있어 가독성이 훼손되고 있습니다.
- **결론**: QueryDSL을 도입하고, `AnimalRepositoryCustom`/`Impl` 구현체를 통해 `JPAQueryFactory` 기반의 자바 코드 동적 쿼리로 전환해 타입 세이프를 확보해야 합니다.

## 3. 종합
이러한 구조적 개선은 시스템 규모 확장에 대비해 유지보수성을 크게 향상시킵니다. 이후 **Phase 2**에서 구체적 실행 계획(`plan.md`)을 수립하겠습니다.

# 프로젝트 개선 계획서 (plan.md)

## 1. 구현 접근 방식 (Implementation Approach)

### 1-1. Mapper 분리 (AnimalMapper, AdoptionMapper)
- **접근 방식**: 데이터를 변환하는 로직을 서비스 레이어에서 `@Component` 어노테이션이 붙은 별도의 Mapper 클래스로 추출합니다. 현재 프로젝트 상황을 고려하여 MapStruct 등의 라이브러리 도입보다는 수동 매퍼 클래스를 직관적으로 구현합니다.
- **장단점 (Trade-offs)**: 
  - *장점*: Service 클래스는 비즈니스 흐름(`what`)에만 집중하며, Mapper는 데이터 변환(`how`)만 담당하여 단일 책임 원칙(SRP)을 지키고 결합도를 낮춥니다. 추후 테스트 작성이 매우 용이해집니다.
  - *단점*: 초기에는 클래스 구조와 파일 개수가 약간 늘어나 구조가 분산되어 보일 수 있습니다.

### 1-2. N+1 문제 해결 (JOIN FETCH / EntityGraph)
- **접근 방식**: JPA의 연관 객체 지연 로딩(Lazy Loading) 설정으로 인해 생기는 반복 쿼리를 방지합니다. 단순 조회의 경우 JpaRepository 메서드 위에 `@EntityGraph`를 우선 활용합니다. 복잡한 페이징은 QueryDSL로 위임합니다.
- **장단점 (Trade-offs)**: 
  - *장점*: DB 왕복 횟수를 드라마틱하게 감소시켜 애플리케이션의 응답 성능(조회 성능)을 크게 향상시킵니다.
  - *단점*: 1:N 관계 패치 조인을 페이징과 함께 사용하면 페이징 처리가 메모리에서 일어나는 심각한 부작용(`firstResult/maxResults specified with fetch join`)이 발생할 수 있습니다. 컬렉션 조인 시에는 가급적 BatchSize 설정을 활용하거나 페이징 쿼리를 우회해야 합니다.

### 1-3. QueryDSL 도입
- **접근 방식**: 하드코딩된 긴 문자열 형태의 `JPQL` 대신, 자바 코드로 타입 세이프(Type-safe)한 동적 쿼리를 작성합니다. `build.gradle`에 QueryDSL 의존성을 추가하고, 컴파일 타임에 자동 생성되는 `Q` 클래스들을 활용합니다.
- **장단점 (Trade-offs)**:
  - *장점*: 쿼리 작성 중에 발생하는 문법 오류를 컴파일 시점에 즉시 파악할 수 있으며, 다중 필터 조건(species, status, size, region 등)이 얽힌 동적 쿼리의 가독성이 획기적으로 개선됩니다.
  - *단점*: `build.gradle` 설정 및 초기 빌드 세팅이 다소 까다로울 수 있으며, Q 클래스 생성 주기를 잘 연동시켜야 합니다.

---

## 2. 변경될 코드 스니펫 및 파일 경로 (Code Snippets & File Paths)

### 2-1. Mapper 신규 생성
- **파일 경로**: `backend/src/main/java/com/dnproject/platform/mapper/AnimalMapper.java` (신규)
```java
@Component
public class AnimalMapper {
    public AnimalResponse toResponse(Animal a) {
        Shelter shelter = a.getShelter();
        // Null 처리 및 DTO 매핑 코드 (기존 Service에서 분리)
        return AnimalResponse.builder()
            // ... 매핑
            .build();
    }
}
```
- **파일 경로**: `backend/src/main/java/com/dnproject/platform/mapper/AdoptionMapper.java` (신규)

### 2-2. 서비스 코드 수정 (Mapper 주입)
- **파일 경로**: `backend/src/main/java/com/dnproject/platform/service/AnimalService.java`
```java
@Service
@RequiredArgsConstructor
public class AnimalService {
    private final AnimalMapper animalMapper; // 주입 추가
    // ... DTO 변환 시 기존 내부 메서드 대신 animalMapper.toResponse(animal) 호출
}
```

### 2-3. QueryDSL 설정 및 Custom Repository 구성
- **파일 경로**: `backend/build.gradle`
```gradle
dependencies {
    // QueryDSL 추가 설정 사항
    implementation 'com.querydsl:querydsl-jpa:5.0.0:jakarta'
    annotationProcessor "com.querydsl:querydsl-apt:5.0.0:jakarta"
    annotationProcessor "jakarta.annotation:jakarta.annotation-api"
    annotationProcessor "jakarta.persistence:jakarta.persistence-api"
}
```
- **파일 경로**: `backend/src/main/java/com/dnproject/platform/config/QuerydslConfig.java` (신규 등록 필요)
- **파일 경로**: `backend/src/main/java/com/dnproject/platform/repository/AnimalRepositoryCustom.java` (신규)
- **파일 경로**: `backend/src/main/java/com/dnproject/platform/repository/AnimalRepositoryImpl.java` (신규)
```java
public class AnimalRepositoryImpl implements AnimalRepositoryCustom {
    private final JPAQueryFactory queryFactory;
    
    // 여기서 다중 필터 동적 쿼리 및 성능 최적화(페이징, 컬렉션 조인 문제 등) 로직을 깔끔하게 처리
}
```

---

## 3. Todo List (Phase 4 대비 구현 목록)

- [x] **Phase 5.1: Mapper 클래스 분리 및 서비스 적용**
  - [x] `AnimalMapper.java` 파일 생성 및 `toResponse` 분리
  - [x] `AdoptionMapper.java` 파일 생성 및 `toResponse` 분리
  - [x] `AnimalService` 기존 `toResponse` 구조 제거 및 Mapper 적용
  - [x] `AdoptionService` 기존 `toResponse` 구조 제거 및 Mapper 적용
  - [x] 타입 에러(Strict Type) 발생 여부 체크
- [x] **Phase 5.2: N+1 문제 파악 및 EntityGraph 적용**
  - [x] `AdoptionRepository`의 전체 조회 메서드에 `@EntityGraph(attributePaths = {"user", "animal.shelter"})` 추가 적용
- [x] **Phase 5.3: QueryDSL 환경 구성**
  - [x] `build.gradle`에 QueryDSL 의존성 및 플러그인 추가
  - [x] `QuerydslConfig.java` 연동
  - [x] `gradlew clean compileJava` 수행하여 Q 엔티티 클래스 생성
- [x] **Phase 5.4: 동적 쿼리 Custom Repository 구현 (QueryDSL 적용)**
  - [x] `AnimalRepositoryCustom.java` 선언 및 `AnimalRepositoryImpl.java` 구현
  - [x] `findWithFilters`, `findWithFiltersRandom`, `findRecommended` 메서드 QueryDSL로 재작성
  - [x] 기존 `AnimalRepository`의 지저분한 `@Query` JPQL 어노테이션 제거
- [x] **Phase 5.5: 최종 통합 점검 및 검증**
  - [x] 백엔드 빌드 검증 (`./gradlew build -x test`)
  - [x] 컴파일 타임 에러 및 타입 문제 철저히 수정

---
type: "LLM,SN"
title: "_Gemini"
created: 2026-01-30
---
> [!summary]+ 3줄 요약
> - **핵심 기술 스택:** Spring Boot, JPA, Thymeleaf, Spring Security 기반의 MVC 모놀리식 쇼핑몰 프로젝트 아키텍처 및 환경 설정을 다룹니다.
> - **주요 기능 구현:** 엔티티 연관 관계 매핑(지연 로딩, 영속성 전이 포함), 이미지 업로드 및 재고 관리, 회원 인증/인가, 장바구니 및 주문 시스템 등 핵심 비즈니스 로직 구현 방식을 분석합니다.
> - **심화 분석 및 Best Practice:** Querydsl을 활용한 동적 쿼리, Auditing, DTO 패턴, N+1 문제 해결, 트랜잭션 관리, 최신 Spring Security 설정 등 실무 관점의 고도화된 기술 및 모범 사례를 제시합니다.

---

## 1\. 전체 아키텍처 및 학습 로드맵

이 책은 **MVC 패턴** 을 기반으로 한 모놀리식 아키텍처(Monolithic Architecture)로 쇼핑몰을 구축합니다. 전체적인 흐름은 다음과 같습니다.

1. **환경 구축 (Environment Setup):** JDK 11, Spring Boot 2.5, MySQL, Maven 기반의 프로젝트 세팅.
2. **도메인 모델링 (Domain Modeling):** JPA `Entity` 설계 및 연관 관계 매핑 (1:1, 1:N, N:M).
3. **데이터 접근 계층 (Repository Layer):** Spring Data JPA 및 **Querydsl** 을 이용한 동적 쿼리 처리.
4. **보안 계층 (Security Layer):** Spring Security를 이용한 회원가입, 로그인, 권한 관리 (User/Admin).
5. **프레젠테이션 계층 (View Layer):****Thymeleaf** 와 Bootstrap을 이용한 서버 사이드 렌더링(SSR).
6. **비즈니스 로직 (Service Layer):**
	- 상품 관리 (등록/수정/조회)
	- 주문 시스템 (주문/취소/이력)
	- 장바구니 (담기/조회/주문)

---

## 2\. 1장 & 2장(초반): 개발 환경 구축 및 엔티티 설계

## 2.1 기술적 핵심 개념 및 해결 과제

- **Problem (문제):** 초기 웹 프로젝트 구축 시 반복되는 설정(Boilerplate)과 데이터베이스 스키마와 객체 간의 불일치(Paradigm Mismatch) 문제.
- **Solution (해결):**
	- **Spring Boot Starter:** 복잡한 의존성을 모듈화하여 빌드 구성을 단순화.
	- **JPA (Hibernate):** SQL 중심 개발에서 객체 중심 개발로 전환. `Entity` 클래스가 테이블을 자동 생성(`ddl-auto`)하도록 하여 생산성 향상.
	- **Lombok:** Getter, Setter 등의 반복 코드를 어노테이션으로 자동화.

---

## 2.2 프로젝트 초기화 및 핵심 설정 (Full Code)

프로젝트의 근간이 되는 빌드 설정과 데이터베이스 연결 설정입니다.

### \[Code 1\] pom.xml (Maven 의존성 설정)

쇼핑몰 프로젝트(`shop`)를 위해 필요한 핵심 라이브러리들입니다.

XML

```markdown
<dependencies xmlns="http://www.w3.org/1999/xhtml">
    <dependency>
        <groupid>org.springframework.boot</groupid>
        <artifactid>spring-boot-starter-data-jpa</artifactid>
    </dependency>
    
    <dependency>
        <groupid>org.springframework.boot</groupid>
        <artifactid>spring-boot-starter-thymeleaf</artifactid>
    </dependency>
    
    <dependency>
        <groupid>org.springframework.boot</groupid>
        <artifactid>spring-boot-starter-web</artifactid>
    </dependency>

    <dependency>
        <groupid>com.h2database</groupid>
        <artifactid>h2</artifactid>
        <scope>runtime</scope>
    </dependency>
    
    <dependency>
        <groupid>mysql</groupid>
        <artifactid>mysql-connector-java</artifactid>
        <scope>runtime</scope>
    </dependency>
    
    <dependency>
        <groupid>org.projectlombok</groupid>
        <artifactid>lombok</artifactid>
        <optional>true</optional>
    </dependency>
    
    <dependency>
        <groupid>org.springframework.boot</groupid>
        <artifactid>spring-boot-starter-test</artifactid>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### \[Code 2\] application.properties (DB 연결 및 JPA 설정)

데이터베이스 연결 정보와 JPA의 DDL 생성 전략을 정의합니다.

Properties

```markdown
# application.properties

# 1. 애플리케이션 포트 설정
server.port=80

# 2. MySQL 연결 설정 (URL, 계정, 비밀번호)
# serverTimezone 설정을 통해 시간대 오류 방지
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost:3306/shop?serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=1234

# 3. JPA 설정
# 실행되는 SQL 쿼리를 콘솔에 출력
spring.jpa.properties.hibernate.show_sql=true
# 콘솔에 출력되는 쿼리를 가독성 좋게 포맷팅
spring.jpa.properties.hibernate.format_sql=true
# 쿼리 파라미터(? 값) 로그 레벨 설정 (Trace 레벨)
logging.level.org.hibernate.type.descriptor.sql=trace

# 4. DDL 생성 전략
# create: 애플리케이션 실행 시점에 기존 테이블을 삭제하고 재생성 (개발 초기용)
spring.jpa.hibernate.ddl-auto=create

# 5. DB Dialect 설정
# 사용하는 DB에 맞는 방언 설정 (MySQL8 사용)
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

---

## 2.3 상품(Item) 엔티티 설계 (Code-Context Mapping)

쇼핑몰의 가장 기본이 되는 상품 데이터를 담을 `Item` 클래스입니다.

- **Logic:** 데이터베이스의 `item` 테이블과 1:1로 매핑됩니다.
- **Key Point:**`@Enumerated(EnumType.STRING)` 을 사용하여 Enum의 순서가 바뀌어도 데이터 무결성이 유지되도록 합니다.

### \[Code 3\] ItemSellStatus.java (상품 판매 상태 Enum)

Java

```markdown
package com.shop.constant;

// 상품이 현재 판매 중인지 품절 상태인지를 나타내는 상수 열거형
public enum ItemSellStatus {
    SELL,       // 판매 중
    SOLD_OUT    // 품절
}
```

### \[Code 4\] Item.java (상품 엔티티)

Java

```markdown
package com.shop.entity;

import com.shop.constant.ItemSellStatus;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import java.time.LocalDateTime;
import javax.persistence.*;

@Entity                     // 이 클래스를 JPA 엔티티로 선언
@Table(name="item")         // 매핑할 DB 테이블 이름을 'item'으로 지정
@Getter @Setter             // Lombok: Getter, Setter 자동 생성
@ToString                   // Lombok: ToString 메서드 자동 생성
public class Item {

    @Id                                                 // Primary Key 지정
    @Column(name="item_id")                             // 테이블 컬럼명을 'item_id'로 매핑
    @GeneratedValue(strategy = GenerationType.AUTO)     // PK 생성 전략을 DB에 위임 (Auto Increment 등)
    private Long id;                                    // 상품 코드

    @Column(nullable = false, length = 50)              // Not Null, 길이 50 제한
    private String itemNm;                              // 상품명

    @Column(name="price", nullable = false)             // 컬럼명 'price', Not Null
    private int price;                                  // 가격

    @Column(nullable = false)
    private int stockNumber;                            // 재고수량

    @Lob                                                // CLOB, BLOB 등 대용량 데이터 매핑
    @Column(nullable = false)
    private String itemDetail;                          // 상품 상세 설명

    @Enumerated(EnumType.STRING)                        // Enum 이름을 DB에 문자로 저장 (권장)
    private ItemSellStatus itemSellStatus;              // 상품 판매 상태 (SELL, SOLD_OUT)

    private LocalDateTime regTime;                      // 등록 시간

    private LocalDateTime updateTime;                   // 수정 시간
}
```

---

## 2.4 심화 분석 및 Best Practice

1. **DDL Auto 옵션 주의 (`ddl-auto`):**
	- 책에서는 편의상 `create` 를 사용했지만, **실제 운영(Production) 환경에서는 절대로 `create`, `create-drop`, `update` 를 사용해서는 안 됩니다.**
	- 운영 환경에서는 `validate` 또는 `none` 을 사용하여 기존 데이터가 삭제되거나 스키마가 의도치 않게 변경되는 사고를 방지해야 합니다.
2. **Enum 매핑 전략:**
	- 기본값인 `EnumType.ORDINAL` 은 Enum의 순서(0, 1...)를 DB에 저장합니다. 중간에 새로운 상수가 추가되면 데이터가 꼬일 수 있으므로, 예제와 같이 반드시 \*\* `EnumType.STRING` \*\*을 사용하여 문자열 그 자체를 저장하는 것이 안전합니다.
3. **Lombok 사용:**
	- Entity 클래스에는 무분별한 `@Data` 사용을 지양하고, 필요한 `@Getter`, `@Setter`, `@ToString` 등을 명시적으로 사용하는 것이 좋습니다. (순환 참조 문제 등 방지)

---

## 2\. 데이터 접근 계층 설계 및 Querydsl 활용

## 2.1 JpaRepository를 이용한 데이터 접근

### Problem & Solution

- **Problem:** 기존 DAO(Data Access Object) 패턴은 단순한 CRUD(등록, 조회, 수정, 삭제)를 위해서도 반복적인 SQL과 코드를 작성해야 했습니다.
- **Solution:****Spring Data JPA** 는 인터페이스만 정의하면 런타임에 동적으로 구현체를 생성해줍니다(`Dynamic Proxy`). 개발자는 구현 클래스 없이 인터페이스만으로 데이터 접근이 가능합니다.

### \[Code 5\] ItemRepository.java (쿼리 메소드 활용)

메소드 이름 자체가 쿼리가 되는 **'쿼리 메소드(Query Method)'** 기능을 사용하여 직관적인 데이터 조회를 구현합니다.

Java

```markdown
package com.shop.repository;

import com.shop.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

// JpaRepository<엔티티, ID타입>을 상속받아 기본 CRUD 기능 장착
public interface ItemRepository extends JpaRepository<item, xmlns="http://www.w3.org/1999/xhtml" long=""> {

    // 1. 쿼리 메소드: 상품명(itemNm)으로 데이터 조회
    // select * from item where item_nm = ?
    List<item> findByItemNm(String itemNm);

    // 2. OR 조건: 상품명 또는 상품 상세 설명으로 조회
    // select * from item where item_nm = ? or item_detail = ?
    List<item> findByItemNmOrItemDetail(String itemNm, String itemDetail);

    // 3. LessThan: 파라미터(price)보다 가격이 낮은 상품 조회
    // select * from item where price &lt; ?
    List<item> findByPriceLessThan(Integer price);

    // 4. OrderBy: 가격이 낮은 순서대로 조회하되, 가격 내림차순 정렬
    // select * from item where price &lt; ? order by price desc
    List<item> findByPriceLessThanOrderByPriceDesc(Integer price);

    // 5. @Query 어노테이션: 복잡한 쿼리를 직접 JPQL로 작성
    // 상품 상세 설명에 특정 검색어가 포함된 상품을 가격 내림차순으로 조회
    // :itemDetail 처럼 파라미터 바인딩 사용
    @Query("select i from Item i where i.itemDetail like %:itemDetail% order by i.price desc")
    List<item> findByItemDetail(@Param("itemDetail") String itemDetail);
}
```

---

## 2.2 Querydsl: 실무형 동적 쿼리 기술

책에서는 **Querydsl** 을 매우 비중 있게 다룹니다. `@Query` 나 쿼리 메소드는 문자열 기반이거나 조건이 많아질수록 이름이 길어지는 단점이 있기 때문입니다.

### 핵심 가치

1. **Type-Safe:** 문자가 아닌 **코드** 로 쿼리를 작성하므로, 오타가 나면 컴파일 시점에 바로 에러를 잡을 수 있습니다.
2. **동적 쿼리:**`BooleanBuilder` 등을 사용하여 조건에 따라 쿼리를 유연하게 조합할 수 있습니다.

### \[Code 6\] pom.xml (Querydsl 설정)

Querydsl 사용을 위해서는 `QDomain` (엔티티의 메타 모델)을 생성해주는 플러그인 설정이 필수적입니다. (책 기준 버전)

XML

```markdown
<dependencies>
    <dependency>
        <groupid>com.querydsl</groupid>
        <artifactid>querydsl-jpa</artifactid>
        <version>4.3.1</version>
    </dependency>
    <dependency>
        <groupid>com.querydsl</groupid>
        <artifactid>querydsl-apt</artifactid>
        <version>4.3.1</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupid>com.mysema.maven</groupid>
            <artifactid>apt-maven-plugin</artifactid>
            <version>1.1.3</version>
            <executions>
                <execution>
                    <goals>
                        <goal>process</goal>
                    </goals>
                    <configuration>
                        <outputdirectory>target/generated-sources/java</outputdirectory>
                        <processor>com.querydsl.apt.jpa.JPAAnnotationProcessor</processor>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

- **Tip:** 설정 후 Maven의 `compile` 을 실행하면 `target/generated-sources` 경로에 `QItem.java` 같은 Q파일들이 생성됩니다.

---

### \[Code 7\] Querydsl 실전 테스트 (JPAQueryFactory)

`ItemRepositoryTest.java` 에서 Querydsl을 이용해 데이터를 조회하는 실무형 예제입니다.

Java

```markdown
package com.shop.repository;

import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shop.entity.Item;
import com.shop.entity.QItem; // 자동 생성된 QClass
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.List;

@SpringBootTest
class ItemRepositoryTest {

    @PersistenceContext
    EntityManager em; // JPA 엔티티 매니저 주입

    @Test
    @DisplayName("Querydsl 조회 테스트1")
    public void queryDslTest() {
        // 1. JPAQueryFactory 생성 (EntityManager 필요)
        JPAQueryFactory queryFactory = new JPAQueryFactory(em);
        
        // 2. QItem 객체 사용 (QItem.item을 통해 엔티티 필드 접근)
        QItem qItem = QItem.item;
        
        // 3. 쿼리 작성 (자바 코드로 SQL 작성)
        // select * from item 
        // where item_sell_status = 'SELL' 
        //   and item_detail like '%테스트 상품 상세 설명%' 
        // order by price desc
        JPAQuery<item> query = queryFactory.selectFrom(qItem)
            .where(qItem.itemSellStatus.eq(ItemSellStatus.SELL))
            .where(qItem.itemDetail.like("%" + "테스트 상품 상세 설명" + "%"))
            .orderBy(qItem.price.desc());

        // 4. 결과 페칭
        List<item> itemList = query.fetch();

        // 5. 결과 검증
        for (Item item : itemList) {
            System.out.println(item.toString());
        }
    }
}
```

---

## 2.3 심화 분석 및 Best Practice

1. **QuerydslPredicateExecutor:**
	- `ItemRepository` 가 `QuerydslPredicateExecutor<item>` 을 상속받으면 리포지토리 메소드 없이도 간단한 Querydsl 조건을 사용할 수 있습니다.
	- 하지만 `left join` 등 복잡한 기능 제약이 있어 실무에서는 \*\* `JPAQueryFactory` \*\*를 별도 클래스(CustomRepository)로 분리하여 사용하는 방식을 더 선호합니다.
2. **Test 환경 분리:**
	- 책에서는 `application-test.properties` 를 생성하여 테스트 시에는 H2 데이터베이스(인메모리)를 사용하도록 설정했습니다. 이는 테스트가 실제 운영 DB에 영향을 주지 않도록 하는 **필수적인 패턴** 입니다.
3. **EntityListeners (Auditing):**
	- 생성일/수정일은 모든 테이블의 공통 관심사입니다. 책 후반부에 나오지만, `BaseEntity` 를 만들어 `@MappedSuperclass` 와 `@EntityListeners(AuditingEntityListener.class)` 를 적용하는 것이 유지보수에 유리합니다.

---

## 3\. 타임리프(Thymeleaf) 템플릿 엔진 학습

## 3.1 기술적 핵심 개념 및 해결 과제

- **Problem (문제):** 순수 HTML은 정적인 페이지만 보여줄 수 있으며, 서버의 데이터(상품 정보, 회원 정보 등)를 동적으로 표현할 수 없습니다. 과거 JSP는 HTML과 로직이 뒤섞여 유지보수가 어려웠습니다.
- **Solution (해결):****Thymeleaf** 는 'Natural Template'을 지향합니다. 즉, 서버가 실행되지 않은 상태에서도 HTML 파일 그 자체로 브라우저에서 열리며, 서버 실행 시에는 속성값(`th:*`)이 렌더링되어 동적 데이터를 표현합니다. 이를 통해 퍼블리셔와 개발자 간의 협업이 원활해집니다.

---

## 3.2 핵심 의존성 및 설정 (Full Code)

타임리프의 기본 엔진과 페이지 레이아웃(헤더, 푸터 분리)을 효율적으로 관리하기 위한 `Layout Dialect` 를 추가합니다.

### \[Code 1\] pom.xml (Thymeleaf 의존성 추가)

XML

```markdown
<dependencies>
    <dependency>
        <groupid>org.springframework.boot</groupid>
        <artifactid>spring-boot-starter-thymeleaf</artifactid>
    </dependency>

    <dependency>
        <groupid>nz.net.ultraq.thymeleaf</groupid>
        <artifactid>thymeleaf-layout-dialect</artifactid>
    </dependency>
</dependencies>
```

---

## 3.3 타임리프 문법 실전 예제 (Code-Context Mapping)

서버에서 데이터를 전달하고, 뷰에서 이를 반복문(`th:each`)과 조건문(`th:if`)으로 처리하는 과정을 구현합니다.

- **Logic:** 컨트롤러는 `Model` 객체에 데이터를 담아 뷰로 전달합니다. 뷰는 `th:` 접두사가 붙은 속성을 통해 이 데이터를 바인딩합니다.

### \[Code 2\] ItemDto.java (데이터 전달용 객체)

Java

```markdown
package com.shop.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter
public class ItemDto {
    private Long id;
    private String itemNm;
    private Integer price;
    private String itemDetail;
    private String sellStatCd;
    private LocalDateTime regTime;
    private LocalDateTime updateTime;
}
```

### \[Code 3\] ThymeleafExController.java (컨트롤러)

Java

```markdown
package com.shop.controller;

import com.shop.dto.ItemDto;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Controller
@RequestMapping(value="/thymeleaf") // '/thymeleaf' 경로로 들어오는 요청 처리
public class ThymeleafExController {

    @GetMapping(value = "/ex02")
    public String thymeleafExample02(Model model){
        // 1. 상품 리스트 생성 (가상의 데이터)
        List<itemdto> itemDtoList = new ArrayList&lt;&gt;();

        for(int i=1; i&lt;=10; i++){
            ItemDto itemDto = new ItemDto();
            itemDto.setItemDetail("상품 상세 설명" + i);
            itemDto.setItemNm("테스트 상품" + i);
            itemDto.setPrice(1000 * i);
            itemDto.setRegTime(LocalDateTime.now());
            
            itemDtoList.add(itemDto);
        }

        // 2. Model에 데이터 담기 ("itemDtoList"라는 키로 뷰에 전달)
        model.addAttribute("itemDtoList", itemDtoList);

        // 3. 뷰 이름 반환 (resources/templates/thymeleafEx/thymeleafEx02.html)
        return "thymeleafEx/thymeleafEx02";
    }
}
```

### \[Code 4\] thymeleafEx02.html (뷰 템플릿)

HTML

```markdown



    <meta charset="UTF-8" />
    <title>Title</title>



<h1>상품 리스트 출력 예제</h1>

<table border="1">
    <thead>
        <tr>
            <td>순번</td>
            <td>상품명</td>
            <td>상품설명</td>
            <td>가격</td>
            <td>상품등록일</td>
        </tr>
    </thead>
    <tbody>
        <tr th:each="itemDto, status : ${itemDtoList}">
            <td th:text="${status.count}"></td>
            
            <td th:text="${itemDto.itemNm}"></td>
            
            <td th:text="${itemDto.itemDetail}"></td>
            
            <td th:text="${itemDto.price}"></td>
            
            <td th:text="${itemDto.regTime}"></td>
        </tr>
    </tbody>
</table>

<div th:if="${not #lists.isEmpty(itemDtoList)}">
    <h3>상품 리스트가 존재합니다.</h3>
</div>
<div th:unless="${not #lists.isEmpty(itemDtoList)}">
    <h3>상품 리스트가 없습니다.</h3>
</div>



```

---

## 3.4 페이지 레이아웃 (Layout Dialect) 적용

실무에서는 모든 페이지에 공통적으로 들어가는 헤더(Header), 푸터(Footer), 스크립트 등을 매번 복사/붙여넣기 하지 않습니다. **Thymeleaf Layout Dialect** 를 사용하여 구조를 잡습니다.

### \[Code 5\] layout1.html (기본 레이아웃 프레임)

---

## 3.5 심화 분석 및 Best Practice

1. **`th:text` vs `th:utext`:**
	- `th:text` 는 HTML 태그를 이스케이프(Escape) 처리하여 문자로 출력합니다(XSS 방지).
	- HTML 태그가 적용된 상태로 출력하려면 `th:utext` 를 사용해야 하지만, 보안상 사용자 입력 데이터에는 신중히 사용해야 합니다.
2. **`th:href="@{...}"`:**
	- 링크 URL 작성 시 반드시 `@{...}` 문법을 사용해야 Context Path(프로젝트 경로)가 변경되어도 유동적으로 적용됩니다. 예: `th:href="@{/item/view(id=${item.id})}"`
3. **Layout Dialect 전략:**
	- `fragments` 폴더에 `header`, `footer`, `sidebar` 등을 분리하고, `layouts` 폴더에 이를 조합한 `default_layout`, `admin_layout` 등을 만들어 관리하는 것이 유지보수에 탁월합니다.

---

## 4\. 스프링 시큐리티(Spring Security)를 이용한 회원 서비스 구축

## 4.1 기술적 핵심 개념 및 해결 과제

- **Problem (문제):** 로그인, 로그아웃, 세션 관리, 권한 체크(관리자 vs 일반 사용자) 기능을 직접 구현하려면 보안 취약점(세션 하이재킹, CSRF 등)에 노출되기 쉽고 개발 공수가 많이 듭니다.
- **Solution (해결):****Spring Security** 는 서블릿 필터(Filter) 기반의 보안 프레임워크입니다. 이를 통해 \*\*인증(Authentication, 누구인가?)\*\*과 \*\*인가(Authorization, 무엇을 할 수 있는가?)\*\*를 표준화된 방식으로 처리합니다.

---

## 4.2 회원(Member) 엔티티 설계 (Full Code)

회원 정보를 저장할 `Member` 엔티티입니다. 회원 생성 로직을 엔티티 내부에 캡슐화(`createMember` 메서드)하여 객체지향적인 설계를 지향합니다.

### \[Code 1\] Member.java (회원 엔티티)

Java

```markdown
package com.shop.entity;

import com.shop.constant.Role;
import com.shop.dto.MemberFormDto;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.crypto.password.PasswordEncoder;
import javax.persistence.*;

@Entity
@Table(name="member")
@Getter @Setter
@ToString
public class Member extends BaseEntity { // BaseEntity는 등록일/수정일 자동 관리를 위해 상속 (추후 설명)

    @Id
    @Column(name="member_id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(unique = true) // 이메일은 중복될 수 없도록 유니크 제약 조건 설정
    private String email;

    private String name;

    private String password;

    private String address;

    @Enumerated(EnumType.STRING) // Role값(USER, ADMIN)을 문자열로 저장
    private Role role;

    // 회원 생성 메소드 (엔티티 내부에 비즈니스 로직 포함)
    public static Member createMember(MemberFormDto memberFormDto, PasswordEncoder passwordEncoder){
        Member member = new Member();
        member.setName(memberFormDto.getName());
        member.setEmail(memberFormDto.getEmail());
        member.setAddress(memberFormDto.getAddress());
        
        // 비밀번호는 반드시 암호화하여 저장해야 함
        String password = passwordEncoder.encode(memberFormDto.getPassword());
        member.setPassword(password);
        
        // 기본 권한은 ADMIN (또는 USER로 설정 가능)
        member.setRole(Role.ADMIN);
        
        return member;
    }
}
```

---

## 4.3 비즈니스 로직 및 로그인 처리 (UserDetailsService)

스프링 시큐리티에서 로그인을 처리하기 위해서는 `UserDetailsService` 인터페이스를 구현해야 합니다.

### \[Code 2\] MemberService.java (로그인 및 회원가입 로직)

- **Logic:**`loadUserByUsername` 메소드를 오버라이딩하여, 로그인 폼에서 넘어온 이메일을 DB에서 찾고, 스프링 시큐리티가 사용할 수 있는 `User` 객체(UserDetails)를 반환합니다.

Java

```markdown
package com.shop.service;

import com.shop.entity.Member;
import com.shop.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional // 로직 수행 중 에러 발생 시 롤백
@RequiredArgsConstructor // final 필드 생성자 주입
public class MemberService implements UserDetailsService {

    private final MemberRepository memberRepository;

    // 회원 가입
    public Member saveMember(Member member){
        validateDuplicateMember(member); // 중복 회원 검증
        return memberRepository.save(member);
    }

    // 중복 회원 검증 로직
    private void validateDuplicateMember(Member member){
        Member findMember = memberRepository.findByEmail(member.getEmail());
        if(findMember != null){
            throw new IllegalStateException("이미 가입된 회원입니다.");
        }
    }

    // [중요] 스프링 시큐리티에서 로그인 시 호출되는 메소드
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Member member = memberRepository.findByEmail(email);

        if(member == null){
            throw new UsernameNotFoundException(email);
        }

        // UserDetails 인터페이스를 구현한 User 객체 반환
        // 생성자: (username, password, authorities)
        return User.builder()
                .username(member.getEmail())
                .password(member.getPassword())
                .roles(member.getRole().toString())
                .build();
    }
}
```

---

## 4.4 시큐리티 설정 (SecurityConfig)

애플리케이션의 보안 정책(URL 접근 권한, 로그인 폼 설정 등)을 정의합니다.*(참고: 책의 집필 시점에 맞춰 `WebSecurityConfigurerAdapter` 상속 방식을 사용합니다.)*

### \[Code 3\] SecurityConfig.java

Java

```markdown
package com.shop.config;

import com.shop.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity // 스프링 시큐리티 필터 체인 자동 적용
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    MemberService memberService;

    // 1. HTTP 보안 설정 (페이지 권한, 로그인, 로그아웃)
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.formLogin()
                .loginPage("/members/login")        // 커스텀 로그인 페이지 URL
                .defaultSuccessUrl("/")             // 로그인 성공 시 이동할 URL
                .usernameParameter("email")         // 로그인 폼의 아이디 필드명 (name="email")
                .failureUrl("/members/login/error") // 로그인 실패 시 이동할 URL
                .and()
            .logout()
                .logoutRequestMatcher(new AntPathRequestMatcher("/members/logout")) // 로그아웃 URL
                .logoutSuccessUrl("/")
                .and();

        // 페이지별 접근 권한 설정
        http.authorizeRequests()
                .mvcMatchers("/", "/members/**", "/item/**", "/images/**").permitAll() // 모든 사용자 접근 가능
                .mvcMatchers("/admin/**").hasRole("ADMIN") // '/admin' 경로는 ADMIN 권한만 접근 가능
                .anyRequest().authenticated(); // 그 외 모든 요청은 인증(로그인) 필요
    }

    // 2. 비밀번호 암호화 객체 빈 등록 (BCrypt 해시 함수 사용)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 3. 인증 매니저 설정 (UserDetailsService 및 암호화 방식 지정)
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(memberService)
            .passwordEncoder(passwordEncoder());
    }
    
    // 4. 정적 리소스(css, js, images)는 보안 필터 무시
    @Override
    public void configure(WebSecurity web) throws Exception {
        web.ignoring().antMatchers("/css/**", "/js/**", "/img/**");
    }
}
```

---

## 4.5 심화 분석 및 Best Practice

1. **SecurityFilterChain 변경 (최신 트렌드):**
	- 책에서는 `WebSecurityConfigurerAdapter` 를 상속받아 구현했지만, **Spring Boot 2.7 이상** 부터는 이 방식이 **Deprecated** 되었습니다.
	- 최신 환경에서는 `SecurityFilterChain` 을 빈(Bean)으로 등록하는 컴포넌트 기반 설정을 권장합니다. (현업 적용 시 마이그레이션 필요)
2. **CSRF (Cross Site Request Forgery):**
	- 스프링 시큐리티는 기본적으로 CSRF 공격 방어가 활성화되어 있습니다. 때문에 POST 요청(회원가입, 로그인 등) 시에는 반드시 CSRF 토큰을 함께 전송해야 합니다. 타임리프 폼 태그(`th:action`) 사용 시 자동으로 토큰이 포함됩니다.
3. **비밀번호 암호화:**
	- DB에 비밀번호를 평문으로 저장하는 것은 중대한 보안 사고의 원인입니다. 반드시 `BCryptPasswordEncoder` 와 같은 강력한 해시 함수를 사용하여 암호화된 문자열만 DB에 저장해야 합니다.

---

## 5\. 연관 관계 매핑과 엔티티 설계 고도화

## 5.1 기술적 핵심 개념 및 해결 과제

- **Problem (문제):** 관계형 데이터베이스(RDB)는 테이블 간의 외래 키(FK)로 관계를 맺지만, 객체는 참조(Reference)로 관계를 맺습니다. 이 패러다임의 불일치로 인해 개발자는 SQL 매핑 작업에 많은 시간을 소모하게 됩니다.
- **Solution (해결):**
	- **JPA 연관 관계 매핑:**`@OneToOne`, `@OneToMany`, `@ManyToOne` 어노테이션을 사용하여 객체의 참조와 테이블의 외래 키를 매핑합니다.
	- **지연 로딩 (Lazy Loading):** 연관된 엔티티를 실제로 사용할 때 조회하여 불필요한 쿼리 실행을 방지합니다.
	- **영속성 전이 (Cascade):** 부모 엔티티의 상태 변화(저장, 삭제 등)를 자식 엔티티에 자동으로 전파합니다.

---

## 5.2 Auditing을 이용한 공통 속성 관리 (BaseEntity)

모든 테이블에 공통적으로 들어가는 **등록 시간, 수정 시간, 등록자, 수정자** 를 매번 엔티티에 작성하는 것은 비효율적입니다. **Spring Data JPA의 Auditing** 기능을 사용하여 이를 자동화합니다.

### \[Code 1\] AuditConfig.java (Auditing 설정)

Java

```markdown
package com.shop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing // JPA Auditing 기능 활성화
public class AuditConfig {

    @Bean
    public AuditorAware<string> auditorProvider() {
        // 실제로는 Spring Security의 인증 정보에서 사용자 ID를 꺼내와야 함
        // 여기서는 예시로 null을 반환하거나 가상의 사용자 반환 구현 가능
        return new AuditorAwareImpl(); 
    }
}
```

### \[Code 2\] BaseEntity.java (공통 엔티티)

- **Logic:**`@MappedSuperclass` 를 사용하여 이 클래스를 상속받는 엔티티들이 아래 필드들을 컬럼으로 인식하게 합니다.
- **Key Point:**`updatable = false` 설정을 통해 등록 시간은 수정되지 않도록 보호합니다.

Java

```markdown
package com.shop.entity;

import lombok.Getter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import javax.persistence.Column;
import javax.persistence.EntityListeners;
import javax.persistence.MappedSuperclass;

@EntityListeners(value = {AuditingEntityListener.class}) // Auditing 리스너 등록
@MappedSuperclass // 공통 매핑 정보가 필요할 때 사용하는 부모 클래스
@Getter
public abstract class BaseEntity extends BaseTimeEntity {

    @CreatedBy
    @Column(updatable = false)
    private String createdBy; // 등록자

    @LastModifiedBy
    private String modifiedBy; // 수정자
}

// 시간 정보만 별도로 분리하여 관리하는 경우도 많음
@EntityListeners(value = {AuditingEntityListener.class})
@MappedSuperclass
@Getter
class BaseTimeEntity {
    
    @org.springframework.data.annotation.CreatedDate
    @Column(updatable = false)
    private java.time.LocalDateTime regTime; // 등록 시간

    @org.springframework.data.annotation.LastModifiedDate
    private java.time.LocalDateTime updateTime; // 수정 시간
}
```

---

## 5.3 장바구니(Cart) 시스템 설계 (Code-Context Mapping)

쇼핑몰의 핵심인 장바구니와 장바구니 상품 엔티티를 설계합니다.

### \[Code 3\] Cart.java (회원과 1:1 매핑)

- **Logic:** 회원 한 명당 하나의 장바구니를 가집니다. `Member` 엔티티를 `@OneToOne` 으로 참조합니다.

Java

```markdown
package com.shop.entity;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import javax.persistence.*;

@Entity
@Table(name = "cart")
@Getter @Setter
@ToString
public class Cart extends BaseEntity {

    @Id
    @Column(name = "cart_id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    // 회원 엔티티와 1:1 매핑
    // FetchType.LAZY: 지연 로딩 (실제 member 데이터를 사용할 때 쿼리 실행)
    @OneToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name="member_id") // 외래 키 이름 지정
    private Member member;

    // 장바구니 생성 메소드
    public static Cart createCart(Member member){
        Cart cart = new Cart();
        cart.setMember(member);
        return cart;
    }
}
```

### \[Code 4\] CartItem.java (장바구니와 N:1 매핑)

- **Logic:** 하나의 장바구니에는 여러 상품이 담길 수 있으므로, `CartItem` 은 `Cart` 와 `@ManyToOne` 관계를 맺습니다.
- **Problem:** 즉시 로딩(`EAGER`)을 사용하면 `CartItem` 하나만 조회해도 연관된 `Member`, `Cart`, `Item` 을 모두 조인하여 가져오는 성능 문제가 발생합니다.
- **Solution:****모든 연관 관계는 지연 로딩(`LAZY`)으로 설정** 하는 것이 실무 원칙입니다.

Java

```markdown
package com.shop.entity;

import lombok.Getter;
import lombok.Setter;
import javax.persistence.*;

@Entity
@Getter @Setter
@Table(name="cart_item")
public class CartItem extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "cart_item_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // 장바구니와 다대일 관계
    @JoinColumn(name="cart_id")
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY) // 상품과 다대일 관계
    @JoinColumn(name = "item_id")
    private Item item;

    private int count; // 담은 수량
}
```

---

## 5.4 주문(Order) 시스템 설계 (영속성 전이)

주문 엔티티는 주문 상품 엔티티들을 관리하는 주체(Parent)입니다. 따라서 **영속성 전이(Cascade)** 옵션을 사용하여 생명주기를 함께 관리합니다.

### \[Code 5\] Order.java (주문 엔티티)

Java

```markdown
package com.shop.entity;

import com.shop.constant.OrderStatus;
import lombok.Getter;
import lombok.Setter;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders") // 'order'는 SQL 예약어이므로 'orders'로 지정
@Getter @Setter
public class Order extends BaseEntity {

    @Id @GeneratedValue
    @Column(name = "order_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    private LocalDateTime orderDate; // 주문일

    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus; // 주문 상태 (ORDER, CANCEL)

    // mappedBy: 연관 관계의 주인은 OrderItem의 'order' 필드임을 명시 (양방향 매핑)
    // cascade = CascadeType.ALL: Order 저장/삭제 시 OrderItem도 함께 저장/삭제
    // orphanRemoval = true: OrderItem 리스트에서 제거된 객체는 DB에서도 삭제 (고아 객체 제거)
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<orderitem> orderItems = new ArrayList&lt;&gt;();

    // 주문 상품 추가 메소드 (양방향 연관 관계 설정)
    public void addOrderItem(OrderItem orderItem){
        orderItems.add(orderItem);
        orderItem.setOrder(this); // OrderItem에도 Order를 세팅해줘야 함
    }
    
    // 생성 메소드
    public static Order createOrder(Member member, List<orderitem> orderItemList){
        Order order = new Order();
        order.setMember(member);
        for(OrderItem orderItem : orderItemList){
            order.addOrderItem(orderItem);
        }
        order.setOrderStatus(OrderStatus.ORDER);
        order.setOrderDate(LocalDateTime.now());
        return order;
    }
}
```

---

## 5.5 심화 분석 및 Best Practice

1. **즉시 로딩(EAGER) vs 지연 로딩(LAZY):**
	- 책의 예제 초반에는 설명의 편의를 위해 `EAGER` 가 언급될 수 있으나, **실무에서는 무조건 `LAZY` 를 기본으로 사용** 합니다.
	- `EAGER` 는 예상치 못한 SQL이 발생(N+1 문제)하여 성능을 심각하게 저하시킵니다.
	- 필요할 때만 `fetch join` 이나 `@EntityGraph` 를 사용하여 데이터를 함께 가져오는 전략을 사용합니다.
2. **CascadeType.ALL &amp; OrphanRemoval:**
	- `Order` 와 `OrderItem` 처럼 **부모-자식의 생명주기가 거의 동일** 하고, 자식이 다른 곳에서 참조되지 않는 경우(소유자가 하나일 때)에만 이 옵션을 사용해야 합니다.
	- 함부로 사용하면 부모를 삭제했을 때 의도치 않게 중요한 자식 데이터까지 모두 삭제될 수 있습니다.

---
6. 상품 등록 및 조회 기능 구현 (이미지 업로드)
6.1 전체 아키텍처 및 흐름
View (Thymeleaf): enctype="multipart/form-data" 속성을 가진 폼을 통해 상품 정보와 이미지 파일들을 전송합니다.

Controller: MultipartFile 리스트 형태로 이미지를 수신합니다.

Service (FileService): 파일명을 중복되지 않게 처리(UUID)하고, 서버의 디스크에 파일을 물리적으로 저장합니다.

Service (ItemImgService): 저장된 파일의 경로와 이름 정보를 DB(item_img 테이블)에 저장합니다.

Config (WebMvcConfig): 브라우저가 디스크에 저장된 이미지에 접근할 수 있도록 URL과 로컬 경로를 매핑합니다.

6.2 기술적 핵심 개념 및 해결 과제
Problem (문제): 사용자가 업로드하는 파일명은 중복될 수 있습니다(예: image.jpg). 중복된 파일명으로 덮어씌워지는 문제를 방지해야 합니다. 또한, 보안상 외부에서 서버 내부의 파일 경로에 직접 접근하는 것을 막아야 합니다.

Solution (해결):

UUID 사용: 파일 저장 시 고유한 식별자(UUID)를 생성하여 파일명을 변경 저장합니다.

Resource Handler: /images/** 와 같은 URL 요청을 서버 내부의 실제 파일 경로(예: C:/shop/item/)로 매핑하여 보안과 접근성을 동시에 해결합니다.

6.3 이미지 업로드 환경 설정 (Full Code)
파일을 저장할 실제 경로와 이를 매핑할 URL 경로를 설정 파일에 정의하고, 스프링 설정 클래스에 적용합니다.

[Code 1] application.properties (경로 설정)
Properties
# 1. 실제 이미지가 저장될 로컬 경로 (OS에 따라 경로 구분자 확인)
# 윈도우 예시: C:/shop/item
# 맥/리눅스 예시: /Users/username/shop/item
itemImgLocation=C:/shop/item

# 2. 브라우저에서 접근할 URL 경로 접두사
# 예: http://localhost/images/item/xxx.jpg 로 접근 시 실제 파일 로딩
uploadPath=/images/item

# 3. 파일 업로드 사이즈 제한
# 파일 하나의 최대 크기 (기본 1MB -> 20MB로 상향)
spring.servlet.multipart.max-file-size=20MB
# 요청 하나당 최대 크기 (기본 10MB -> 100MB로 상향)
spring.servlet.multipart.max-request-size=100MB
[Code 2] WebMvcConfig.java (리소스 핸들러 매핑)
서버의 로컬 경로(file:///...)를 웹 URL 경로(/images/...)와 연결해주는 핵심 설정입니다.

Java
package com.shop.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${uploadPath}") // application.properties의 값 주입 (/images/item)
    String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 브라우저 URL에 /images/** 로 시작하는 요청이 들어오면
        // uploadPath에 설정된 경로의 파일들을 읽어서 보여줌
        registry.addResourceHandler("/images/**")
                .addResourceLocations(uploadPath); // 로컬 컴퓨터에 저장된 파일을 읽어올 root 경로
    }
}
6.4 파일 처리 유틸리티 및 엔티티 구현
[Code 3] FileService.java (파일 저장 로직)
파일 업로드 기능은 상품뿐만 아니라 리뷰, 프로필 등 여러 곳에서 쓰일 수 있으므로 별도의 서비스로 분리하여 재사용성을 높입니다.

Java
package com.shop.service;

import lombok.extern.java.Log;
import org.springframework.stereotype.Service;
import java.io.FileOutputStream;
import java.util.UUID;

@Service
@Log
public class FileService {

    // 파일 업로드 메소드
    public String uploadFile(String uploadPath, String originalFileName, byte[] fileData) throws Exception {
        
        // 1. UUID 생성 (파일 이름 중복 방지)
        UUID uuid = UUID.randomUUID();
        
        // 2. 확장자 추출 (예: .jpg)
        String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        
        // 3. 저장될 파일 이름 생성 (UUID + 확장자)
        String savedFileName = uuid.toString() + extension;
        
        // 4. 전체 업로드 경로 생성
        String fileUploadFullUrl = uploadPath + "/" + savedFileName;
        
        // 5. 파일 바이트 데이터를 파일로 저장 (FileOutputStream 사용)
        FileOutputStream fos = new FileOutputStream(fileUploadFullUrl);
        fos.write(fileData);
        fos.close(); // I/O 리소스 반환
        
        return savedFileName; // 저장된 파일명 반환
    }

    // 파일 삭제 메소드 (상품 수정/삭제 시 사용)
    public void deleteFile(String filePath) throws Exception {
        java.io.File deleteFile = new java.io.File(filePath);
        
        if(deleteFile.exists()) {
            deleteFile.delete();
            log.info("파일을 삭제하였습니다.");
        } else {
            log.info("파일이 존재하지 않습니다.");
        }
    }
}
[Code 4] ItemImg.java (상품 이미지 엔티티)
DB에는 이미지 파일 자체가 아닌, 파일의 경로와 이름 정보만 저장합니다.

Java
package com.shop.entity;

import lombok.Getter;
import lombok.Setter;
import javax.persistence.*;

@Entity
@Table(name="item_img")
@Getter @Setter
public class ItemImg extends BaseEntity {

    @Id
    @Column(name="item_img_id")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String imgName; // 저장된 이미지 파일명 (UUID 포함)

    private String oriImgName; // 원본 이미지 파일명

    private String imgUrl; // 이미지 조회 경로

    private String repImgYn; // 대표 이미지 여부 (Y: 대표, N: 일반)

    // 상품 엔티티와 다대일 단방향 관계 (상품 하나에 이미지 여러 개)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    // 이미지 정보 업데이트 메소드 (Dirty Checking 활용)
    public void updateItemImg(String oriImgName, String imgName, String imgUrl){
        this.oriImgName = oriImgName;
        this.imgName = imgName;
        this.imgUrl = imgUrl;
    }
}
6.5 상품 등록 비즈니스 로직 (Service Layer)
상품 정보와 이미지 파일들을 함께 받아 트랜잭션 하나로 묶어 저장합니다.

[Code 5] ItemImgService.java (이미지 저장 서비스)
Java
package com.shop.service;

import com.shop.entity.ItemImg;
import com.shop.repository.ItemImgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.thymeleaf.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class ItemImgService {

    @Value("${itemImgLocation}")
    private String itemImgLocation; // C:/shop/item

    private final ItemImgRepository itemImgRepository;
    private final FileService fileService;

    public void saveItemImg(ItemImg itemImg, MultipartFile itemImgFile) throws Exception{
        String oriImgName = itemImgFile.getOriginalFilename();
        String imgName = "";
        String imgUrl = "";

        // 파일 업로드 (파일이 있을 경우에만 수행)
        if(!StringUtils.isEmpty(oriImgName)){
            // FileService를 호출하여 실제 디스크에 파일 저장
            imgName = fileService.uploadFile(itemImgLocation, oriImgName, itemImgFile.getBytes());
            
            // 저장된 파일명으로 접근 URL 생성 (/images/item/uuid.jpg)
            imgUrl = "/images/item/" + imgName;
        }

        // 엔티티에 정보 저장
        itemImg.updateItemImg(oriImgName, imgName, imgUrl);
        itemImgRepository.save(itemImg);
    }
}
[Code 6] ItemService.java (상품 + 이미지 등록 통합 서비스)
Java
package com.shop.service;

import com.shop.dto.ItemFormDto;
import com.shop.entity.Item;
import com.shop.entity.ItemImg;
import com.shop.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final ItemImgService itemImgService;

    public Long saveItem(ItemFormDto itemFormDto, List<MultipartFile> itemImgFileList) throws Exception{
        
        // 1. 상품 등록
        Item item = itemFormDto.createItem(); // DTO -> Entity 변환
        itemRepository.save(item);

        // 2. 이미지 등록
        for(int i=0; i<itemImgFileList.size(); i++){
            ItemImg itemImg = new ItemImg();
            itemImg.setItem(item); // 연관 관계 설정

            // 첫 번째 이미지는 대표 이미지(Y)로 설정
            if(i == 0)
                itemImg.setRepImgYn("Y");
            else
                itemImg.setRepImgYn("N");

            // 이미지 저장 서비스 호출
            itemImgService.saveItemImg(itemImg, itemImgFileList.get(i));
        }

        return item.getId();
    }
}
6.6 심화 분석 및 Best Practice
트랜잭션 관리와 파일 I/O:

현재 구조는 DB 트랜잭션(@Transactional) 내에서 파일 I/O가 일어납니다.

주의점: 파일 저장은 성공했는데 DB 저장이 실패하여 롤백되는 경우, **디스크에 남은 고아 파일(Orphan File)**이 발생할 수 있습니다.

Best Practice: 실무에서는 트랜잭션이 커밋된 후(TransactionSynchronizationManager) 파일을 저장하거나, 배치 작업을 통해 주기적으로 DB에 없는 파일을 삭제하는 별도 프로세스를 둡니다.

OS 독립적인 경로 설정:

코드 내에 "C:/" 처럼 경로를 하드코딩하면 리눅스 서버 배포 시 에러가 발생합니다. application.properties로 경로를 분리하고, 자바의 File.separator를 활용하는 것이 좋습니다.

보안 (WebMvcConfig):

addResourceLocations 설정 시 반드시 경로 끝에 /를 붙여야 제대로 인식되는 경우가 많으니 주의해야 합니다. (예: file:///C:/shop/item/)

---
7. 주문 시스템 구현 및 구매 이력 조회
7.1 기술적 핵심 개념 및 해결 과제
Problem (문제): 동시에 여러 사용자가 주문을 시도할 때 재고(Stock)가 정확하게 관리되어야 합니다. 또한, 주문 로직은 서비스 계층에만 몰아넣기보다 객체지향적으로 분산되어야 유지보수가 쉽습니다.

Solution (해결):

도메인 모델 패턴 (Domain Model Pattern): 비즈니스 로직(재고 감소, 주문 취소 등)을 엔티티(Item, Order) 내부에 구현하여 응집도를 높입니다.

재고 관리: 주문 시 재고를 감소시키고(removeStock), 취소 시 재고를 원복(addStock)하는 로직을 엔티티 메소드로 캡슐화합니다.

커스텀 예외 (Custom Exception): 재고 부족 시 OutOfStockException을 발생시켜 명확한 에러 처리를 수행합니다.

7.2 핵심 도메인 로직 구현 (Entity Layer)
서비스 계층이 아닌 엔티티가 스스로 비즈니스 로직을 처리하도록 설계합니다.

[Code 1] Item.java (재고 감소 로직 추가)
Java
package com.shop.entity;

import com.shop.exception.OutOfStockException;
// ... imports

public class Item extends BaseEntity {
    
    // ... 기존 필드 생략 ...

    // 재고 감소 로직 (주문 발생 시 호출)
    public void removeStock(int stockNumber){
        int restStock = this.stockNumber - stockNumber;
        
        // 재고 부족 시 예외 발생 (RuntimeException 상속)
        if(restStock < 0){
            throw new OutOfStockException("상품의 재고가 부족합니다. (현재 재고 수량: " + this.stockNumber + ")");
        }
        this.stockNumber = restStock;
    }

    // 재고 증가 로직 (주문 취소 시 호출)
    public void addStock(int stockNumber){
        this.stockNumber += stockNumber;
    }
}
[Code 2] Order.java (주문 취소 로직 추가)
Java
package com.shop.entity;

// ... imports

public class Order extends BaseEntity {

    // ... 기존 필드 및 createOrder 메소드 생략 ...

    // 주문 취소 로직
    public void cancelOrder(){
        this.orderStatus = OrderStatus.CANCEL; // 상태 변경
        
        // 주문 상품들의 재고 원복
        for(OrderItem orderItem : orderItems){
            orderItem.cancel();
        }
    }
}
[Code 3] OrderItem.java (주문 상품 취소 로직)
Java
public class OrderItem extends BaseEntity {
    
    // ... 기존 필드 생략 ...

    // 주문 취소 시 재고 원복 호출
    public void cancel() {
        this.getItem().addStock(count); // 주문 수량만큼 재고 증가
    }
}
7.3 주문 처리 비즈니스 로직 (Service Layer)
사용자(Member)와 상품(Item) 엔티티를 조회하여 주문(Order)을 생성하고 저장하는 트랜잭션의 중심입니다.

[Code 4] OrderService.java (주문 생성)
Java
package com.shop.service;

import com.shop.dto.OrderDto;
import com.shop.entity.*;
import com.shop.repository.ItemRepository;
import com.shop.repository.MemberRepository;
import com.shop.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class OrderService {

    private final ItemRepository itemRepository;
    private final MemberRepository memberRepository;
    private final OrderRepository orderRepository;

    public Long order(OrderDto orderDto, String email){
        // 1. 주문할 상품 조회
        Item item = itemRepository.findById(orderDto.getItemId())
                .orElseThrow(EntityNotFoundException::new);

        // 2. 현재 로그인한 회원 조회
        Member member = memberRepository.findByEmail(email);

        // 3. 주문 상품 엔티티 생성 (이 시점에서 재고 감소 로직 호출됨)
        List<OrderItem> orderItemList = new ArrayList<>();
        OrderItem orderItem = OrderItem.createOrderItem(item, orderDto.getCount());
        orderItemList.add(orderItem);

        // 4. 주문 엔티티 생성
        Order order = Order.createOrder(member, orderItemList);
        
        // 5. 주문 저장 (Cascade 옵션으로 인해 OrderItem도 함께 저장)
        orderRepository.save(order);

        return order.getId();
    }
}
7.4 구매 이력 조회 (DTO & Repository)
단순 엔티티 조회가 아닌, 화면에 필요한 데이터만 골라서 조회하기 위해 **DTO(Data Transfer Object)**를 활용합니다. 특히 페이징(Pagination) 처리를 위해 Pageable 인터페이스를 사용합니다.

[Code 5] OrderHistDto.java (구매 이력 DTO)
Java
package com.shop.dto;

import com.shop.constant.OrderStatus;
import com.shop.entity.Order;
import lombok.Getter;
import lombok.Setter;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
public class OrderHistDto {

    // 화면에 보여줄 주문 정보 필드
    private Long orderId; // 주문 아이디
    private String orderDate; // 주문 날짜
    private OrderStatus orderStatus; // 주문 상태
    
    // 주문 상품 리스트 (하나의 주문에 여러 상품이 있을 수 있음)
    private List<OrderItemDto> orderItemDtoList = new ArrayList<>();

    // 생성자에서 엔티티를 DTO로 변환
    public OrderHistDto(Order order){
        this.orderId = order.getId();
        this.orderDate = order.getOrderDate()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        this.orderStatus = order.getOrderStatus();
    }
    
    public void addOrderItemDto(OrderItemDto orderItemDto){
        orderItemDtoList.add(orderItemDto);
    }
}
[Code 6] OrderRepository.java (페이징 쿼리)
Logic: @Query를 사용하여 복잡한 조인이나 조건 검색을 처리합니다. 현재 로그인한 사용자의 주문 내역을 최신순으로 가져옵니다.

Java
public interface OrderRepository extends JpaRepository<Order, Long> {

    // 페이징 처리: 해당 회원의 주문 목록을 최신순으로 조회
    @Query("select o from Order o " +
           "where o.member.email = :email " +
           "order by o.orderDate desc")
    List<Order> findOrders(@Param("email") String email, Pageable pageable);

    // 해당 회원의 총 주문 개수 (페이징 계산용)
    @Query("select count(o) from Order o " +
           "where o.member.email = :email")
    Long countOrder(@Param("email") String email);
}
7.5 심화 분석 및 Best Practice
Dirty Checking (변경 감지):

JPA의 강력한 기능 중 하나입니다. order.cancelOrder()를 호출하여 엔티티의 상태(status)와 재고(stock)를 변경하면, 별도의 repository.save() 호출 없이도 트랜잭션이 끝나는 시점에 자동으로 Update 쿼리가 실행됩니다.

DTO 반환의 중요성:

컨트롤러에서 뷰로 데이터를 넘길 때 엔티티(Order)를 그대로 넘기면, 양방향 참조로 인한 무한 루프나 민감한 정보 노출의 위험이 있습니다. 반드시 OrderHistDto와 같은 DTO로 변환하여 반환해야 합니다.

N+1 문제 주의:

findOrders로 주문 목록을 가져올 때, 각 주문(Order)에 속한 주문 상품(OrderItem)과 그 상품의 이미지(ItemImg)를 조회하면서 N+1 문제가 발생할 수 있습니다.

책의 예제는 기본 @Query를 사용하지만, 실무에서는 fetch join 또는 **@EntityGraph**를 사용하여 한 번의 쿼리로 연관 데이터를 모두 가져오는 최적화가 필수적입니다.

---

## 8\. 장바구니(Cart) 기능 구현

## 8.1 기술적 핵심 개념 및 해결 과제

- **Problem (문제):** 장바구니는 '회원'과 1:1 관계이지만, 실제로는 '장바구니 상품'이라는 중간 엔티티를 통해 N:M 관계처럼 동작합니다. 또한, 장바구니에 이미 담긴 상품을 또 담을 경우 새로 운 레코드를 생성하는 것이 아니라 **수량(Count)만 업데이트** 해야 합니다.
- **Solution (해결):**
	- **CartService 로직 분기:** 처음 담는 상품은 `save()`, 이미 있는 상품은 `addCount()` 메소드(Dirty C hecking)를 호출합니 다.
	- **DTO Projection:** 장바구니 목록 조회 시 `Item`, `ItemImg`, `CartItem` 세 테이블을 조인해야 하므로, 성능 최적화를 위해 **DTO로 바로 조회하는 JPQL** 을 작성합니다.

---

## 8.2 장바구니 담기 (Add to Cart)

### \[Code 1\] CartItemDto.java (데이터 전달 객체)

사용자로부터 상품 아이디와 수량을 전달받는 DTO입니다. 유효성 검사(`@Min`)를 통해 비정상적인 데이터 유입을 막습니다.

Java

```markdown
package com.shop.dto;

import lombok.Getter;
import lombok.Setter;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Getter @Setter
public class CartItemDto {

    @NotNull(message = "상품 아이디는 필수 입력 값 입니다.")
    private Long itemId;

    @Min(value = 1, message = "최소 1개 이상 담아주세요.")
    private int count;
}
```

### \[Code 2\] CartService.java (장바구니 담기 로직)

- **Logic:**
	1. 로그인한 회원의 장바구니가 없으면 새로 생성합니다.
	2. 해당 장바구니에 이미 같은 상품이 있는지 확인합니다 (`findByCartIdAndItemId`).
	3. 있다면 수량만 증가시키고, 없다면 `CartItem` 을 새로 생성하여 저장합니다.

Java

```markdown
package com.shop.service;

import com.shop.dto.CartItemDto;
import com.shop.entity.Cart;
import com.shop.entity.CartItem;
import com.shop.entity.Item;
import com.shop.entity.Member;
import com.shop.repository.CartItemRepository;
import com.shop.repository.CartRepository;
import com.shop.repository.ItemRepository;
import com.shop.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.persistence.EntityNotFoundException;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final ItemRepository itemRepository;
    private final MemberRepository memberRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    public Long addCart(CartItemDto cartItemDto, String email){
        
        // 1. 장바구니 담을 상품 조회
        Item item = itemRepository.findById(cartItemDto.getItemId())
                .orElseThrow(EntityNotFoundException::new);
        
        // 2. 현재 로그인한 회원 조회
        Member member = memberRepository.findByEmail(email);

        // 3. 회원의 장바구니 조회 (없으면 생성)
        Cart cart = cartRepository.findByMemberId(member.getId());
        if(cart == null){
            cart = Cart.createCart(member);
            cartRepository.save(cart);
        }

        // 4. 해당 상품이 장바구니에 이미 있는지 조회
        CartItem savedCartItem = cartItemRepository.findByCartIdAndItemId(cart.getId(), item.getId());

        if(savedCartItem != null){
            // 5-1. 이미 있다면 수량만 증가 (Dirty Checking)
            savedCartItem.addCount(cartItemDto.getCount());
            return savedCartItem.getId();
        } else {
            // 5-2. 없다면 새로 생성하여 저장
            CartItem cartItem = CartItem.createCartItem(cart, item, cartItemDto.getCount());
            cartItemRepository.save(cartItem);
            return cartItem.getId();
        }
    }
}
```

---

## 8.3 장바구니 조회 (DTO Projection)

장바구니 목록에는 '상품 이미지', '상품명', '가격', '수량' 등 여러 테이블의 정보가 필요합니다. 엔티티를 조회해서 루프를 돌며 다시 쿼리를 날리는 것(N+1 문제)을 방지하기 위해 **JPQL 생성자 식** 을 사용합니다.

### \[Code 3\] CartDetailDto.java

Java

```markdown
package com.shop.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CartDetailDto {
    private Long cartItemId; // 장바구니 상품 ID
    private String itemNm; // 상품명
    private int price; // 가격
    private int count; // 수량
    private String imgUrl; // 상품 이미지 경로

    // JPQL에서 사용할 생성자
    public CartDetailDto(Long cartItemId, String itemNm, int price, int count, String imgUrl){
        this.cartItemId = cartItemId;
        this.itemNm = itemNm;
        this.price = price;
        this.count = count;
        this.imgUrl = imgUrl;
    }
}
```

### \[Code 4\] CartItemRepository.java (조회 쿼리)

- **Key Point:**`new com.shop.dto.CartDetailDto(...)` 문법을 사용하여 DB에서 가져온 결과를 즉시 DTO로 변환합니다.

Java

```markdown
public interface CartItemRepository extends JpaRepository<cartitem, long=""> {
    
    // 장바구니 아이디와 상품 아이디로 CartItem 조회
    CartItem findByCartIdAndItemId(Long cartId, Long itemId);

    // [중요] 장바구니 상세 정보 조회 JPQL
    // CartItem(ci) -&gt; Item(i) -&gt; ItemImg(im) 조인
    // 대표 이미지(im.repImgYn = 'Y')만 조회 조건 추가
    @Query("select new com.shop.dto.CartDetailDto(ci.id, i.itemNm, i.price, ci.count, im.imgUrl) " +
           "from CartItem ci, ItemImg im " +
           "join ci.item i " +
           "where ci.cart.id = :cartId " +
           "and im.item.id = ci.item.id " +
           "and im.repImgYn = 'Y' " +
           "order by ci.regTime desc")
    List<cartdetaildto> findCartDetailDtoList(@Param("cartId") Long cartId);
}
```

---

## 8.4 장바구니 수정 및 삭제

장바구니 화면에서 수량을 변경하거나 X 버튼을 눌러 삭제하는 기능입니다. 보안을 위해 **'현재 로그인한 사용자가 이 장바구니 아이템의 주인인지'** 검증하는 로직이 필수적입니다.

### \[Code 5\] CartService.java (수정/삭제/검증 추가)

Java

```markdown
// ... CartService 내부 ...

    // 1. 수량 변경 로직
    // updateCartItemCount 메소드는 엔티티 내부에 구현 (this.count = count;)
    public void updateCartItemCount(Long cartItemId, int count){
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(EntityNotFoundException::new);

        cartItem.updateCount(count); // Dirty Checking으로 자동 Update 쿼리 실행
    }

    // 2. 삭제 로직
    public void deleteCartItem(Long cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(EntityNotFoundException::new);
        
        cartItemRepository.delete(cartItem);
    }

    // 3. 사용자 유효성 검증 (보안)
    // 수정/삭제 요청을 보낸 'email'과 장바구니 아이템을 소유한 회원의 'email' 비교
    @Transactional(readOnly = true)
    public boolean validateCartItem(Long cartItemId, String email){
        Member curMember = memberRepository.findByEmail(email); // 로그인한 회원
        
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(EntityNotFoundException::new);
        Member savedMember = cartItem.getCart().getMember(); // 아이템 소유 회원

        return org.thymeleaf.util.StringUtils.equals(curMember.getEmail(), savedMember.getEmail());
    }
```

---

## 8.5 심화 분석 및 Best Practice

1. **JPQL 생성자 투영 (Constructor Expression):**
	- DTO로 직접 조회하는 방식은 필요한 데이터만 SELECT 하므로 네트워크 전송량을 줄이고 성능을 높일 수 있습니다. 하지만 JPQL 문자열 내에 패키지 경로를 모두 적어야 하므로 오타 발생 시 런타임 에러가 발생할 수 있습니다.
	- 이를 보완하기 위해 **Querydsl** 의 `Projections.constructor()` 기능을 사용하면 컴파일 타임에 타입 체크가 가능해져 더욱 안전합니다.
2. **클라이언트 사이드 검증 vs 서버 사이드 검증:**
	- 장바구니 수량 변경 시 자바스크립트로도 막을 수 있지만, API를 직접 호출하는 공격을 막기 위해 서버(`CartItemDto`, `validateCartItem`)에서도 반드시 이중 검증을 수행해야 합니다.
3. **장바구니 데이터의 휘발성:**
	- 현재 로직은 DB에 저장하므로 영구 보관되지만, 로그인하지 않은 사용자(Guest)의 장바구니는 세션(Session)이나 쿠키(Cookie), 혹은 Redis와 같은 인메모리 DB를 사용하여 임시 저장하는 전략을 주로 사용합니다.

---

## 9\. 장바구니 상품 주문 (일괄 주문 처리)

## 9.1 기술적 핵심 개념 및 해결 과제

- **Problem (문제):** 기존 `OrderService.order()` 메소드는 단 하나의 상품만 주문할 수 있도록 설계되었습니다. 장바구니에서는 여러 상품을 리스트 형태로 받아 하나의 주문 번호(Order ID)로 묶어서 처리해야 합니다.
- **Solution (해결):**
	- **로직 재사용 및 확장:**`OrderService` 에 `orders()` 메소드를 오버로딩하거나 새로 만들어 다중 상품 처리를 지원합니다.
	- **트랜잭션 관리:** 주문 생성과 장바구니 비우기(삭제)가 하나의 트랜잭션으로 묶여야 합니다. 만약 주문은 성공했는데 장바구니 삭제가 실패하면 데이터 불일치가 발생합니다.

---

## 9.2 데이터 전송 객체 (DTO)

장바구니에서 선택된 상품들의 아이디를 전달받기 위한 DTO입니다.

### \[Code 1\] CartOrderDto.java

Java

```markdown
package com.shop.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class CartOrderDto {

    private Long cartItemId; // 장바구니 상품 ID

    // 자신을 리스트로 갖는 구조는 아니지만, 
    // 컨트롤러에서는 @RequestBody List<cartorderdto> 형태로 데이터를 받습니다.
    // 화면에서 넘겨주는 JSON 데이터 구조에 맞춰 설계합니다.
}
```

---

## 9.3 다중 상품 주문 로직 (OrderService)

기존 단일 주문 로직을 업그레이드하여, 상품 리스트를 받아 주문을 생성하는 로직을 추가합니다.

### \[Code 2\] OrderService.java (다중 주문 처리 추가)

- **Logic:**
	1. `OrderDto` 리스트를 순회하며 각각 `Item` 엔티티를 조회하고 `OrderItem` 을 생성합니다.
	2. 생성된 `OrderItem` 리스트를 모아서 하나의 `Order` 엔티티를 생성(`createOrder`)합니다.
	3. `Order` 를 저장하면 Cascade 옵션에 의해 `OrderItem` 들도 함께 저장됩니다.

Java

```markdown
// ... OrderService 클래스 내부 ...

    public Long orders(List<orderdto> orderDtoList, String email){

        // 1. 로그인한 회원 조회
        Member member = memberRepository.findByEmail(email);

        // 2. 주문 상품 리스트 생성
        List<orderitem> orderItemList = new ArrayList&lt;&gt;();

        for(OrderDto orderDto : orderDtoList){
            // 상품 조회
            Item item = itemRepository.findById(orderDto.getItemId())
                    .orElseThrow(EntityNotFoundException::new);

            // 주문 상품 엔티티 생성
            OrderItem orderItem = OrderItem.createOrderItem(item, orderDto.getCount());
            orderItemList.add(orderItem);
        }

        // 3. 주문 엔티티 생성 (한 명의 회원이 여러 상품을 한 번에 주문)
        Order order = Order.createOrder(member, orderItemList);
        
        // 4. 주문 저장
        orderRepository.save(order);

        return order.getId();
    }
```

---

## 9.4 장바구니 주문 연결 로직 (CartService)

`CartService` 는 장바구니 아이템을 `OrderDto` 로 변환하여 주문 로직을 호출하고, **주문이 완료된 상품을 장바구니에서 제거** 하는 역할을 합니다.

### \[Code 3\] CartService.java (주문 및 장바구니 비우기)

Java

```markdown
// ... CartService 클래스 내부 ...

    private final OrderService orderService; // 주문 로직 호출을 위해 주입

    public Long orderCartItem(List<cartorderdto> cartOrderDtoList, String email){

        List<orderdto> orderDtoList = new ArrayList&lt;&gt;();

        // 1. 장바구니 아이템 -&gt; 주문 아이템 변환
        for(CartOrderDto cartOrderDto : cartOrderDtoList){
            CartItem cartItem = cartItemRepository.findById(cartOrderDto.getCartItemId())
                    .orElseThrow(EntityNotFoundException::new);

            OrderDto orderDto = new OrderDto();
            orderDto.setItemId(cartItem.getItem().getId());
            orderDto.setCount(cartItem.getCount());
            orderDtoList.add(orderDto);
        }

        // 2. 주문 로직 호출
        Long orderId = orderService.orders(orderDtoList, email);

        // 3. 주문한 장바구니 상품 제거
        for(CartOrderDto cartOrderDto : cartOrderDtoList){
            CartItem cartItem = cartItemRepository.findById(cartOrderDto.getCartItemId())
                    .orElseThrow(EntityNotFoundException::new);
            cartItemRepository.delete(cartItem);
        }

        return orderId;
    }
```

---

## 9.5 컨트롤러 구현 (CartController)

클라이언트(화면)에서 보낸 데이터를 받아 유효성을 검증하고 서비스를 호출합니다.

### \[Code 4\] CartController.java

- **Logic:**
	- `@RequestBody`: JSON 형태로 넘어온 데이터를 자바 객체 리스트로 변환합니다.
	- **권한 검증:** 선택된 장바구니 아이템들이 정말 현재 로그인한 사용자의 것인지 위변조 여부를 체크합니다.

Java

```markdown
// ... CartController 클래스 내부 ...

    @PostMapping(value = "/cart/orders")
    public @ResponseBody ResponseEntity orderCartItem(@RequestBody CartOrderDto cartOrderDto, 
                                                      Principal principal){
        
        // 화면에서 넘어온 리스트 구조라고 가정 (실제로는 List<cartorderdto>가 넘어옴)
        List<cartorderdto> cartOrderDtoList = cartOrderDto.getCartOrderDtoList();

        // 1. 데이터 유효성 및 권한 검증
        if(cartOrderDtoList == null || cartOrderDtoList.size() == 0){
            return new ResponseEntity<string>("주문할 상품을 선택해주세요", HttpStatus.FORBIDDEN);
        }

        for(CartOrderDto cartOrder : cartOrderDtoList){
            // CartService의 validateCartItem 메소드 재사용
            if(!cartService.validateCartItem(cartOrder.getCartItemId(), principal.getName())){
                return new ResponseEntity<string>("주문 권한이 없습니다.", HttpStatus.FORBIDDEN);
            }
        }

        // 2. 주문 로직 실행
        Long orderId = cartService.orderCartItem(cartOrderDtoList, principal.getName());

        // 3. 결과 반환
        return new ResponseEntity<long>(orderId, HttpStatus.OK);
    }
```

---

## 9.6 심화 분석 및 Best Practice

1. **벌크 연산(Bulk Operation) 최적화:**
	- 현재 코드의 `cartItemRepository.delete(cartItem)` 는 반복문 안에서 단건으로 실행됩니다. 상품이 100개라면 delete 쿼리가 100번 나갑니다.
	- **개선:**`delete from cart_item where cart_item_id in (...)` 와 같이 **JPQL 벌크 삭제 쿼리** 를 사용하면 1번의 쿼리로 처리할 수 있어 성능이 획기적으로 개선됩니다.
2. **트랜잭션 전파 (Transaction Propagation):**
	- `CartService` 와 `OrderService` 모두 `@Transactional` 이 걸려 있습니다.
	- 기본값(`REQUIRED`)에 의해 `CartService` 의 트랜잭션 안에서 `OrderService` 가 실행되므로, 하나의 큰 트랜잭션으로 묶여 \*\*Atomic(원자성)\*\*이 보장됩니다.
3. **예외 처리 전략:**
	- 주문 과정 중 재고 부족(`OutOfStockException`)이 발생하면, 런타임 예외이므로 트랜잭션이 전체 **롤백(Rollback)** 됩니다. 즉, 장바구니 상품도 삭제되지 않고 그대로 유지되어 데이터 정합성이 지켜집니다.

---

이로써 책의 주요 기능 구현에 대한 분석을 모두 마쳤습니다. 책은 이 외에도 **메인 페이지 상품 진열**, **상품 상세 페이지 구현**, **리뷰 및 평점** 등의 내용으로 이어질 수 있으나, 핵심적인 \*\*쇼핑몰 아키텍처(회원-상품-주문-장바구니)\*\*는 여기까지가 완결입니다.

**추가로 궁금한 점이 있으시거나, 특정 챕터에 대한 보충 설명이 필요하신가요?** (예: 배포 방법, AWS 연동, 혹은 전체 요약 정리 등)

  

Gemini는 인물 등에 관한 정보 제공 시 실수를 할 수 있으니 다시 한번 확인하세요. [개인 정보 보호 및 Gemini 새 창에서 열기](https://support.google.com/gemini?p=privacy_notice)

Google 계정

정용준

everywhereworkplace@gmail.com</long></string></string></cartorderdto></cartorderdto></orderdto></cartorderdto></orderitem></orderdto></cartorderdto></cartdetaildto></cartitem,></order></order,></orderitemdto></itemimgfilelist.size();></multipartfile></orderitem></orderitem></string></itemdto></item></item></item></item></item></item></item></item></item,>
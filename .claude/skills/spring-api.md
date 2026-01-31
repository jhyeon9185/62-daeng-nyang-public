---
name: spring-api
description: Creates Spring Boot REST API endpoints with Controller, Service, Repository pattern. Use when creating new API endpoints, CRUD operations. Keywords: api, endpoint, controller, service, repository, rest.
---

# Spring API Generator

## Purpose
Generate REST API following project conventions:
- Controller → Service → Repository layered architecture
- Proper DTO usage for request/response
- Exception handling
- Swagger/OpenAPI documentation

## Controller Template
Location: `backend/src/main/java/com/dnproject/platform/controller/{DomainController}.java`

```java
package com.dnproject.platform.controller;

import com.dnproject.platform.dto.request.*;
import com.dnproject.platform.dto.response.*;
import com.dnproject.platform.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/domains")
@RequiredArgsConstructor
@Tag(name = "Domain", description = "Domain management APIs")
public class DomainController {

    private final DomainService domainService;

    @GetMapping
    @Operation(summary = "Get all domains", description = "Returns paginated list of domains")
    public ResponseEntity<Page<DomainResponse>> getAll(Pageable pageable) {
        return ResponseEntity.ok(domainService.findAll(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get domain by ID")
    public ResponseEntity<DomainResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(domainService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new domain")
    public ResponseEntity<DomainResponse> create(@Valid @RequestBody DomainCreateRequest request) {
        return ResponseEntity.ok(domainService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update domain")
    public ResponseEntity<DomainResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody DomainUpdateRequest request) {
        return ResponseEntity.ok(domainService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete domain")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        domainService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

## Service Template
Location: `backend/src/main/java/com/dnproject/platform/service/{DomainService}.java`

```java
package com.dnproject.platform.service;

import com.dnproject.platform.domain.*;
import com.dnproject.platform.dto.request.*;
import com.dnproject.platform.dto.response.*;
import com.dnproject.platform.exception.*;
import com.dnproject.platform.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DomainService {

    private final DomainRepository domainRepository;

    public Page<DomainResponse> findAll(Pageable pageable) {
        return domainRepository.findAll(pageable)
                .map(DomainResponse::from);
    }

    public DomainResponse findById(Long id) {
        Domain domain = domainRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Domain not found: " + id));
        return DomainResponse.from(domain);
    }

    @Transactional
    public DomainResponse create(DomainCreateRequest request) {
        Domain domain = request.toEntity();
        return DomainResponse.from(domainRepository.save(domain));
    }

    @Transactional
    public DomainResponse update(Long id, DomainUpdateRequest request) {
        Domain domain = domainRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Domain not found: " + id));
        domain.update(request);
        return DomainResponse.from(domain);
    }

    @Transactional
    public void delete(Long id) {
        if (!domainRepository.existsById(id)) {
            throw new ResourceNotFoundException("Domain not found: " + id);
        }
        domainRepository.deleteById(id);
    }
}
```

## Repository Template
Location: `backend/src/main/java/com/dnproject/platform/repository/{DomainRepository}.java`

```java
package com.dnproject.platform.repository;

import com.dnproject.platform.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DomainRepository extends JpaRepository<Domain, Long> {

    Optional<Domain> findByName(String name);

    List<Domain> findByStatus(StatusEnum status);

    @Query("SELECT d FROM Domain d WHERE d.parent.id = :parentId")
    List<Domain> findByParentId(@Param("parentId") Long parentId);

    boolean existsByName(String name);
}
```

## DTO Templates

### Request DTO
Location: `backend/src/main/java/com/dnproject/platform/dto/request/{DomainCreateRequest}.java`

```java
package com.dnproject.platform.dto.request;

import com.dnproject.platform.domain.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DomainCreateRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;

    @NotNull(message = "Status is required")
    private StatusEnum status;

    public Domain toEntity() {
        return Domain.builder()
                .name(name)
                .status(status)
                .build();
    }
}
```

### Response DTO
Location: `backend/src/main/java/com/dnproject/platform/dto/response/{DomainResponse}.java`

```java
package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
public class DomainResponse {

    private Long id;
    private String name;
    private StatusEnum status;
    private LocalDateTime createdAt;

    public static DomainResponse from(Domain domain) {
        return DomainResponse.builder()
                .id(domain.getId())
                .name(domain.getName())
                .status(domain.getStatus())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
```

## Project APIs (DN Platform)

### Auth API (`/api/v1/auth`)
- POST `/signup` - 회원가입
- POST `/login` - 로그인
- POST `/logout` - 로그아웃
- GET `/me` - 내 정보 조회
- POST `/refresh` - 토큰 갱신

### Animal API (`/api/v1/animals`)
- GET `/` - 동물 목록 조회 (필터, 페이징)
- GET `/{id}` - 동물 상세 조회
- POST `/` - 동물 등록 (보호소 관리자)
- PUT `/{id}` - 동물 정보 수정
- DELETE `/{id}` - 동물 삭제

### Adoption API (`/api/v1/adoptions`)
- POST `/` - 입양/임보 신청
- GET `/my` - 내 신청 목록
- PUT `/{id}/cancel` - 신청 취소
- PUT `/{id}/approve` - 승인 (보호소 관리자)
- PUT `/{id}/reject` - 거절 (보호소 관리자)

### Volunteer API (`/api/v1/volunteers`)
- GET `/recruitments` - 모집공고 목록
- POST `/recruitments` - 모집공고 등록 (보호소 관리자)
- POST `/` - 봉사 신청
- GET `/my` - 내 봉사 목록
- PUT `/{id}/approve` - 승인
- PUT `/{id}/reject` - 거절

### Donation API (`/api/v1/donations`)
- GET `/requests` - 기부 요청 목록
- POST `/requests` - 기부 요청 등록 (보호소 관리자)
- POST `/` - 기부 신청
- GET `/my` - 내 기부 목록
- PUT `/{id}/approve` - 승인
- PUT `/{id}/complete` - 완료 처리

### Board API (`/api/v1/boards`)
- GET `/` - 게시글 목록
- GET `/{id}` - 게시글 상세
- POST `/` - 게시글 작성
- PUT `/{id}` - 게시글 수정
- DELETE `/{id}` - 게시글 삭제
- POST `/{id}/comments` - 댓글 작성

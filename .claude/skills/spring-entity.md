---
name: spring-entity
description: Creates Spring Boot JPA entities with proper annotations and relationships. Use when creating database entities, domain models. Keywords: entity, domain, jpa, database, model.
---

# Spring Entity Generator

## Purpose
Generate JPA entities following project conventions:
- Lombok annotations for boilerplate reduction
- Proper JPA annotations
- Audit fields (createdAt, updatedAt)
- Relationship mappings

## Entity Template
Location: `backend/src/main/java/com/dnproject/platform/domain/{EntityName}.java`

```java
package com.dnproject.platform.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "table_name")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityName {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fieldName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusEnum status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private ParentEntity parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChildEntity> children = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

## Project Entities (DN Platform)

### User
- id, email, password, name, phone, address, role
- Relations: Preference (1:1), Shelter (1:1), Adoptions (1:N), Volunteers (1:N)

### Shelter
- id, name, address, latitude, longitude, phone, email
- manager_id, manager_name, manager_phone
- business_registration_number, verification_status
- Relations: Animals (1:N), VolunteerRecruitments (1:N), DonationRequests (1:N)

### Animal
- id, shelter_id, species, breed, name, age, gender, size
- weight, description, temperament, health_status
- neutered, vaccinated, image_url, status
- Relations: Shelter (N:1), Adoptions (1:N)

### Adoption
- id, user_id, animal_id, type, status
- reason, experience, living_env, family_agreement
- reject_reason, processed_at
- Relations: User (N:1), Animal (N:1)

### VolunteerRecruitment
- id, shelter_id, title, content, max_applicants, deadline, status
- Relations: Shelter (N:1), Volunteers (1:N)

### Volunteer
- id, recruitment_id, user_id, applicant_name, applicant_phone, applicant_email
- activity_region, activity_field, volunteer_date_start, volunteer_date_end
- activity_cycle, preferred_time_slot, volunteer_type, experience, status
- Relations: VolunteerRecruitment (N:1), User (N:1)

### DonationRequest
- id, shelter_id, title, content, item_category
- target_quantity, current_quantity, deadline, status
- Relations: Shelter (N:1), Donations (1:N)

### Donation
- id, request_id, user_id, donor_name, donor_phone, donor_email
- item_name, quantity, delivery_method, tracking_number
- receipt_requested, status
- Relations: DonationRequest (N:1), User (N:1)

### Board
- id, user_id, shelter_id, type, title, content, views, is_pinned
- Relations: User (N:1), Shelter (N:1), Comments (1:N)

### Comment
- id, board_id, user_id, content
- Relations: Board (N:1), User (N:1)

### Notification
- id, user_id, type, message, is_read, related_url
- Relations: User (N:1)

## Enum Types

```java
// Role.java
public enum Role {
    USER, SHELTER_ADMIN, SUPER_ADMIN
}

// Species.java
public enum Species {
    DOG, CAT
}

// AnimalStatus.java
public enum AnimalStatus {
    PROTECTED, ADOPTED, FOSTERING
}

// AdoptionStatus.java
public enum AdoptionStatus {
    PENDING, APPROVED, REJECTED, CANCELLED
}

// BoardType.java
public enum BoardType {
    NOTICE, FAQ, FREE, VOLUNTEER, DONATION
}
```

## Relationship Guidelines
- Use `FetchType.LAZY` for `@ManyToOne` and `@OneToMany`
- Use `cascade = CascadeType.ALL` carefully
- Add `orphanRemoval = true` when children should be deleted with parent
- Always use `mappedBy` on the inverse side of bidirectional relationships

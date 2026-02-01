package com.dnproject.platform.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "animal_favorites", indexes = {
    @Index(name = "idx_favorites_user", columnList = "user_id"),
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_favorites_user_animal", columnNames = {"user_id", "animal_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Column(name = "created_at")
    private Instant createdAt;
}

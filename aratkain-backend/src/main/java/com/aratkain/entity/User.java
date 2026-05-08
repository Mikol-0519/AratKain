package com.aratkain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(name = "user_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String fullname;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    // Nullable — Supabase Auth handles password hashing
    @Column(length = 255)
    private String password;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "user";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.userId == null) this.userId = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
    }
}
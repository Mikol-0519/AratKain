package com.aratkain.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.Map;

public class AuthDtos {

    // ── Register Request ──────────────────────────────────────
    @Data
    public static class RegisterRequest {

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$",
                message = "Username can only contain letters, numbers, and underscores")
        private String username;

        @NotBlank(message = "Full name is required")
        private String fullname;

        @NotBlank(message = "Email is required")
        @Email(message = "Please enter a valid email address")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "Please confirm your password")
        private String confirmPassword;
    }

    // ── Login Request ─────────────────────────────────────────
    @Data
    public static class LoginRequest {

        @NotBlank(message = "Email is required")
        @Email(message = "Please enter a valid email address")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    // ── Update Profile Request ────────────────────────────────
    @Data
    public static class UpdateProfileRequest {

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50)
        @Pattern(regexp = "^[a-zA-Z0-9_]+$",
                message = "Username can only contain letters, numbers, and underscores")
        private String username;

        @NotBlank(message = "Full name is required")
        private String fullname;
    }

    // ── Change Password Request ───────────────────────────────
    @Data
    public static class ChangePasswordRequest {

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String newPassword;

        @NotBlank(message = "Please confirm your new password")
        private String confirmPassword;
    }

    // ── Auth Response ─────────────────────────────────────────
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AuthResponse {
        private String token;
        private String userId;
        private String username;
        private String fullname;
        private String email;
        private String role;
        private String photoUrl;
        private String message;
    }

    // ── Profile Response ──────────────────────────────────────
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProfileResponse {
        private String userId;
        private String username;
        private String fullname;
        private String email;
        private String role;
        private String photoUrl;
        private String createdAt;
    }

    // ── Message Response ──────────────────────────────────────
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MessageResponse {
        private String message;
        private boolean success;
    }

    // ── Error Response ────────────────────────────────────────
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ErrorResponse {
        private String error;
        private String message;
        private Map<String, String> fieldErrors;
        private int status;
        private String timestamp;
    }
}
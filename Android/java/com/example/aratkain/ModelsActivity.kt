package com.aratkain.model

// ── Auth Request Models ───────────────────────────────────────

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val username: String,
    val fullname: String,
    val email: String,
    val password: String,
    val confirmPassword: String
)

data class ForgotPasswordRequest(
    val email: String,
    val newPassword: String
)

data class ChangePasswordRequest(
    val newPassword: String
)

data class UpdateProfileRequest(
    val username: String,
    val fullname: String
)

// ── Auth Response Models ──────────────────────────────────────

data class AuthResponse(
    val token: String?,
    val username: String?,
    val fullname: String?,
    val email: String?,
    val role: String?,
    val message: String?
)

data class UserProfile(
    val user_id: String?,
    val username: String?,
    val fullname: String?,
    val email: String?,
    val role: String?,
    val photo_url: String?,
    val created_at: String?
)

data class ErrorResponse(
    val error: String?,
    val message: String?,
    val status: Int?,
    val fieldErrors: Map<String, String>?
)

data class MessageResponse(
    val message: String?,
    val success: Boolean?
)
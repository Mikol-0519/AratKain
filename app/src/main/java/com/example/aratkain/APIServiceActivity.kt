package com.aratkain.api

import com.aratkain.model.*
import retrofit2.Call
import retrofit2.http.*

interface ApiService {

    // ── Auth ─────────────────────────────────────────────────

    @POST("auth/login")
    fun login(@Body request: LoginRequest): Call<AuthResponse>

    @POST("auth/register")
    fun register(@Body request: RegisterRequest): Call<AuthResponse>

    @GET("auth/health")
    fun health(): Call<String>

    // ── Profile ───────────────────────────────────────────────

    @GET("profile/me")
    fun getProfile(
        @Header("Authorization") token: String
    ): Call<UserProfile>

    @PUT("profile/update")
    fun updateProfile(
        @Header("Authorization") token: String,
        @Body request: UpdateProfileRequest
    ): Call<MessageResponse>

    @PUT("profile/change-password")
    fun changePassword(
        @Header("Authorization") token: String,
        @Body request: ChangePasswordRequest
    ): Call<MessageResponse>
}
package com.aratkain.api

import com.aratkain.model.*
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

// ── Supabase credentials ──────────────────────────────────────
object SupabaseConfig {
    const val PROJECT_URL = "https://oyohrydkfhsmgwrejvga.supabase.co"
    const val ANON_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95b2hyeWRrZmhzbWd3cmVqdmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTgxMjYsImV4cCI6MjA4ODM5NDEyNn0.oBD-bp0GJNCJI-OMOy8rUtK1eD_2iFKmzjcDF8_ICWA"
}

// ── Supabase Auth API ─────────────────────────────────────────
interface SupabaseAuthApi {

    @POST("auth/v1/signup")
    fun signUp(@Body body: Map<String, String>): Call<SupabaseAuthResponse>

    @POST("auth/v1/token?grant_type=password")
    fun signIn(@Body body: Map<String, String>): Call<SupabaseAuthResponse>

    @POST("auth/v1/user")
    fun updatePassword(
        @Header("Authorization") token: String,
        @Body body: Map<String, String>
    ): Call<SupabaseAuthResponse>
}

data class SupabaseAuthResponse(
    val access_token: String?,
    val token_type: String?,
    val user: SupabaseUser?,
    val error: String?,
    val error_description: String?,
    val msg: String?
)

data class SupabaseUser(
    val id: String?,
    val email: String?
)

// ── Supabase Database REST API ────────────────────────────────
interface SupabaseDbApi {

    @GET("rest/v1/users")
    fun getUser(
        @Header("Authorization") token: String,
        @Query("user_id") userId: String,          // eq.{id}
        @Query("select") select: String = "user_id,username,fullname,email,photo_url,role"
    ): Call<List<UserProfile>>

    @POST("rest/v1/users")
    fun insertUser(
        @Header("Authorization") token: String,
        @Header("Prefer") prefer: String = "return=minimal",
        @Body user: Map<String, String?>
    ): Call<Void>

    @PATCH("rest/v1/users")
    fun updateUser(
        @Header("Authorization") token: String,
        @Header("Prefer") prefer: String = "return=minimal",
        @Query("user_id") userId: String,          // eq.{id}
        @Body updates: Map<String, String?>
    ): Call<Void>
}

// ── Auth Retrofit instance ────────────────────────────────────
object SupabaseAuthClient {
    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logging)
        .addInterceptor { chain ->
            val req = chain.request().newBuilder()
                .addHeader("apikey", SupabaseConfig.ANON_KEY)
                .addHeader("Content-Type", "application/json")
                .build()
            chain.proceed(req)
        }
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    val auth: SupabaseAuthApi by lazy {
        Retrofit.Builder()
            .baseUrl(SupabaseConfig.PROJECT_URL + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SupabaseAuthApi::class.java)
    }

    val db: SupabaseDbApi by lazy {
        Retrofit.Builder()
            .baseUrl(SupabaseConfig.PROJECT_URL + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SupabaseDbApi::class.java)
    }
}
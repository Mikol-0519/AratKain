package com.aratkain.utils

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("AratKainSession", Context.MODE_PRIVATE)

    companion object {
        const val KEY_TOKEN    = "access_token"
        const val KEY_USER_ID  = "user_id"
        const val KEY_USERNAME = "username"
        const val KEY_FULLNAME = "fullname"
        const val KEY_EMAIL    = "email"
        const val KEY_PHOTO    = "photo_url"
    }

    fun saveSession(token: String, userId: String, username: String,
                    fullname: String, email: String) {
        prefs.edit().apply {
            putString(KEY_TOKEN,    token)
            putString(KEY_USER_ID,  userId)
            putString(KEY_USERNAME, username)
            putString(KEY_FULLNAME, fullname)
            putString(KEY_EMAIL,    email)
            apply()
        }
    }

    fun getToken(): String?    = prefs.getString(KEY_TOKEN, null)
    fun getUserId(): String?   = prefs.getString(KEY_USER_ID, null)
    fun getUsername(): String? = prefs.getString(KEY_USERNAME, null)
    fun getFullname(): String? = prefs.getString(KEY_FULLNAME, null)
    fun getEmail(): String?    = prefs.getString(KEY_EMAIL, null)
    fun getPhotoUrl(): String? = prefs.getString(KEY_PHOTO, null)

    fun getBearerToken(): String = "Bearer ${getToken()}"

    fun updateProfile(username: String, fullname: String) {
        prefs.edit().apply {
            putString(KEY_USERNAME, username)
            putString(KEY_FULLNAME, fullname)
            apply()
        }
    }

    fun updatePhoto(photoUrl: String) {
        prefs.edit().putString(KEY_PHOTO, photoUrl).apply()
    }

    fun isLoggedIn(): Boolean = getToken() != null

    fun logout() {
        prefs.edit().clear().apply()
    }
}
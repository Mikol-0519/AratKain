package com.aratkain.utils

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.google.gson.Gson
import com.aratkain.model.ErrorResponse
import retrofit2.Response

object NetworkUtils {

    fun isConnected(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun parseError(response: Response<*>): String {
        return try {
            val json = response.errorBody()?.string()
            val error = Gson().fromJson(json, ErrorResponse::class.java)
            when (response.code()) {
                400 -> error?.message ?: "Invalid request. Please check your input."
                401 -> "Invalid email or password."
                409 -> error?.message ?: "Account already exists."
                500 -> "Server error. Please try again later."
                else -> error?.message ?: "Something went wrong. (${response.code()})"
            }
        } catch (e: Exception) {
            when (response.code()) {
                401 -> "Invalid email or password."
                500 -> "Server error. Please try again later."
                else -> "Error ${response.code()}. Please try again."
            }
        }
    }

    fun getNetworkError(t: Throwable): String {
        return when {
            t.message?.contains("Unable to resolve host") == true ->
                "No internet connection. Please check your network."
            t.message?.contains("timeout") == true ->
                "Connection timed out. Please try again."
            t.message?.contains("Connection refused") == true ->
                "Cannot connect to server. Please try again later."
            else -> "Network error: ${t.message}"
        }
    }
}
package com.aratkain.ui.auth

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.aratkain.api.SupabaseAuthClient
import com.aratkain.databinding.ActivityForgotPasswordBinding
import com.aratkain.model.UserProfile
import com.aratkain.utils.NetworkUtils
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityForgotPasswordBinding
    private var verifiedEmail = ""
    private var step = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = "Forgot Password"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        binding.btnNext.setOnClickListener {
            if (step == 1) verifyEmail()
            else resetPassword()
        }

        binding.tvBack.setOnClickListener { finish() }
    }

    private fun verifyEmail() {
        val email = binding.etEmail.text.toString().trim()
        binding.tilEmail.error = null

        if (email.isEmpty()) { binding.tilEmail.error = "Email is required"; return }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Enter a valid email"; return
        }

        if (!NetworkUtils.isConnected(this)) { showError("No internet connection."); return }

        setLoading(true)

        SupabaseAuthClient.db.getUser(
            token  = "Bearer ${com.aratkain.api.SupabaseConfig.ANON_KEY}",
            userId = "eq.ignored",
            select = "email"
        ).enqueue(object : Callback<List<UserProfile>> {
            override fun onResponse(call: Call<List<UserProfile>>, response: Response<List<UserProfile>>) {
                setLoading(false)
                // Check via direct email filter
                checkEmailExists(email)
            }
            override fun onFailure(call: Call<List<UserProfile>>, t: Throwable) {
                setLoading(false)
                checkEmailExists(email)
            }
        })
    }

    private fun checkEmailExists(email: String) {
        // Use Supabase RPC to check email
        setLoading(true)
        // We'll just attempt sign-in with a wrong password — if 400, email exists; if 400 with "Invalid login credentials" email may not exist
        // Simpler: try to query users table with email filter
        val retrofit = retrofit2.Retrofit.Builder()
            .baseUrl(com.aratkain.api.SupabaseConfig.PROJECT_URL + "/")
            .client(okhttp3.OkHttpClient.Builder()
                .addInterceptor { chain ->
                    chain.proceed(chain.request().newBuilder()
                        .addHeader("apikey", com.aratkain.api.SupabaseConfig.ANON_KEY)
                        .addHeader("Authorization", "Bearer ${com.aratkain.api.SupabaseConfig.ANON_KEY}")
                        .build())
                }.build())
            .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
            .build()

        val api = retrofit.create(com.aratkain.api.SupabaseDbApi::class.java)

        // Query users table by email
        val call = retrofit.create(object : Any() {}.javaClass.interfaces.firstOrNull()
            ?: com.aratkain.api.SupabaseDbApi::class.java)

        // Direct approach: use OkHttp to check email
        val okClient = okhttp3.OkHttpClient()
        val request = okhttp3.Request.Builder()
            .url("${com.aratkain.api.SupabaseConfig.PROJECT_URL}/rest/v1/users?email=eq.$email&select=email")
            .addHeader("apikey", com.aratkain.api.SupabaseConfig.ANON_KEY)
            .addHeader("Authorization", "Bearer ${com.aratkain.api.SupabaseConfig.ANON_KEY}")
            .build()

        Thread {
            try {
                val resp = okClient.newCall(request).execute()
                val body = resp.body?.string() ?: "[]"
                val found = body != "[]" && body != "[ ]"

                runOnUiThread {
                    setLoading(false)
                    if (found) {
                        verifiedEmail = email
                        goToStep2()
                    } else {
                        binding.tilEmail.error = "No account found with this email"
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    setLoading(false)
                    showError("Network error. Please try again.")
                }
            }
        }.start()
    }

    private fun goToStep2() {
        step = 2
        binding.layoutStep1.visibility = View.GONE
        binding.layoutStep2.visibility = View.VISIBLE
        binding.tvStepIndicator.text   = "Step 2 of 2 — Set new password for $verifiedEmail"
        binding.btnNext.text           = "Update Password"
        binding.progressStep1.progress = 100
        binding.progressStep2.progress = 0
    }

    private fun resetPassword() {
        val newPassword     = binding.etNewPassword.text.toString().trim()
        val confirmPassword = binding.etConfirmPassword.text.toString().trim()

        binding.tilNewPassword.error     = null
        binding.tilConfirmPassword.error = null

        var valid = true
        if (newPassword.isEmpty()) { binding.tilNewPassword.error = "Required"; valid = false }
        else if (newPassword.length < 6) { binding.tilNewPassword.error = "At least 6 characters"; valid = false }
        if (newPassword != confirmPassword) { binding.tilConfirmPassword.error = "Passwords do not match"; valid = false }
        if (!valid) return

        setLoading(true)

        // Call Supabase RPC function reset_user_password
        val okClient = okhttp3.OkHttpClient()
        val json = """{"user_email":"$verifiedEmail","new_password":"$newPassword"}"""
        val body = okhttp3.RequestBody.create(okhttp3.MediaType.parse("application/json"), json)
        val request = okhttp3.Request.Builder()
            .url("${com.aratkain.api.SupabaseConfig.PROJECT_URL}/rest/v1/rpc/reset_user_password")
            .post(body)
            .addHeader("apikey", com.aratkain.api.SupabaseConfig.ANON_KEY)
            .addHeader("Authorization", "Bearer ${com.aratkain.api.SupabaseConfig.ANON_KEY}")
            .addHeader("Content-Type", "application/json")
            .build()

        Thread {
            try {
                val resp = okClient.newCall(request).execute()
                runOnUiThread {
                    setLoading(false)
                    if (resp.isSuccessful) {
                        showSuccessScreen()
                    } else {
                        showError("Failed to reset password. Please try again.")
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    setLoading(false)
                    showError("Network error. Please try again.")
                }
            }
        }.start()
    }

    private fun showSuccessScreen() {
        binding.layoutStep2.visibility   = View.GONE
        binding.layoutSuccess.visibility = View.VISIBLE
        binding.btnGoToLogin.setOnClickListener { finish() }
    }

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnNext.isEnabled      = !loading
    }

    private fun showError(msg: String) {
        binding.tvError.text       = msg
        binding.tvError.visibility = View.VISIBLE
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
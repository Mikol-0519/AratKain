package com.aratkain.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.aratkain.api.SupabaseAuthClient
import com.aratkain.api.SupabaseAuthResponse
import com.aratkain.databinding.ActivityLoginBinding
import com.aratkain.ui.dashboard.DashboardActivity
import com.aratkain.utils.NetworkUtils
import com.aratkain.utils.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        session = SessionManager(this)

        binding.btnLogin.setOnClickListener { doLogin() }
        binding.tvRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
        binding.tvForgotPassword.setOnClickListener {
            startActivity(Intent(this, ForgotPasswordActivity::class.java))
        }
    }

    private fun doLogin() {
        val email    = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        // ── Validation ────────────────────────────────────────
        binding.tilEmail.error    = null
        binding.tilPassword.error = null

        var valid = true
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email is required"; valid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Enter a valid email"; valid = false
        }
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password is required"; valid = false
        }
        if (!valid) return

        // ── Network check ─────────────────────────────────────
        if (!NetworkUtils.isConnected(this)) {
            showError("No internet connection. Please check your network.")
            return
        }

        setLoading(true)

        val body = mapOf("email" to email, "password" to password)

        SupabaseAuthClient.auth.signIn(body).enqueue(object : Callback<SupabaseAuthResponse> {
            override fun onResponse(call: Call<SupabaseAuthResponse>, response: Response<SupabaseAuthResponse>) {
                setLoading(false)
                if (response.isSuccessful) {
                    val data  = response.body()
                    val token = data?.access_token
                    val userId = data?.user?.id

                    if (token != null && userId != null) {
                        // Fetch profile from users table
                        fetchProfile(token, userId, email)
                    } else {
                        showError("Login failed. Please try again.")
                    }
                } else {
                    showError(NetworkUtils.parseError(response))
                }
            }

            override fun onFailure(call: Call<SupabaseAuthResponse>, t: Throwable) {
                setLoading(false)
                showError(NetworkUtils.getNetworkError(t))
            }
        })
    }

    private fun fetchProfile(token: String, userId: String, email: String) {
        SupabaseAuthClient.db.getUser(
            token = "Bearer $token",
            userId = "eq.$userId"
        ).enqueue(object : Callback<List<com.aratkain.model.UserProfile>> {
            override fun onResponse(
                call: Call<List<com.aratkain.model.UserProfile>>,
                response: Response<List<com.aratkain.model.UserProfile>>
            ) {
                val profile = response.body()?.firstOrNull()
                session.saveSession(
                    token    = token,
                    userId   = userId,
                    username = profile?.username ?: email.substringBefore("@"),
                    fullname = profile?.fullname ?: "",
                    email    = email
                )
                profile?.photo_url?.let { session.updatePhoto(it) }

                startActivity(Intent(this@LoginActivity, DashboardActivity::class.java))
                finish()
            }

            override fun onFailure(call: Call<List<com.aratkain.model.UserProfile>>, t: Throwable) {
                // Login still works even if profile fetch fails
                session.saveSession(token, userId, email.substringBefore("@"), "", email)
                startActivity(Intent(this@LoginActivity, DashboardActivity::class.java))
                finish()
            }
        })
    }

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnLogin.isEnabled     = !loading
        binding.btnLogin.text          = if (loading) "Logging in…" else "Log In"
    }

    private fun showError(msg: String) {
        binding.tvError.text       = msg
        binding.tvError.visibility = View.VISIBLE
    }
}
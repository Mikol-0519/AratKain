package com.aratkain.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.aratkain.api.SupabaseAuthClient
import com.aratkain.api.SupabaseAuthResponse
import com.aratkain.databinding.ActivityRegisterBinding
import com.aratkain.utils.NetworkUtils
import com.aratkain.utils.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        session = SessionManager(this)

        binding.btnRegister.setOnClickListener { doRegister() }
        binding.tvLogin.setOnClickListener { finish() }
    }

    private fun doRegister() {
        val username        = binding.etUsername.text.toString().trim()
        val fullname        = binding.etFullname.text.toString().trim()
        val email           = binding.etEmail.text.toString().trim()
        val password        = binding.etPassword.text.toString().trim()
        val confirmPassword = binding.etConfirmPassword.text.toString().trim()

        // ── Validation ────────────────────────────────────────
        clearErrors()
        var valid = true

        if (username.isEmpty()) {
            binding.tilUsername.error = "Username is required"; valid = false
        } else if (username.length < 3) {
            binding.tilUsername.error = "At least 3 characters"; valid = false
        } else if (!username.matches(Regex("^[a-zA-Z0-9_]+$"))) {
            binding.tilUsername.error = "Letters, numbers, underscores only"; valid = false
        }
        if (fullname.isEmpty()) {
            binding.tilFullname.error = "Full name is required"; valid = false
        }
        if (email.isEmpty()) {
            binding.tilEmail.error = "Email is required"; valid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.error = "Enter a valid email"; valid = false
        }
        if (password.isEmpty()) {
            binding.tilPassword.error = "Password is required"; valid = false
        } else if (password.length < 6) {
            binding.tilPassword.error = "At least 6 characters"; valid = false
        }
        if (confirmPassword != password) {
            binding.tilConfirmPassword.error = "Passwords do not match"; valid = false
        }
        if (!valid) return

        if (!NetworkUtils.isConnected(this)) {
            showError("No internet connection."); return
        }

        setLoading(true)

        val body = mapOf("email" to email, "password" to password)

        SupabaseAuthClient.auth.signUp(body).enqueue(object : Callback<SupabaseAuthResponse> {
            override fun onResponse(call: Call<SupabaseAuthResponse>, response: Response<SupabaseAuthResponse>) {
                if (response.isSuccessful) {
                    val token  = response.body()?.access_token
                    val userId = response.body()?.user?.id

                    if (token != null && userId != null) {
                        insertUserProfile(token, userId, username, fullname, email)
                    } else {
                        setLoading(false)
                        showError("Registration failed. Please try again.")
                    }
                } else {
                    setLoading(false)
                    showError(NetworkUtils.parseError(response))
                }
            }

            override fun onFailure(call: Call<SupabaseAuthResponse>, t: Throwable) {
                setLoading(false)
                showError(NetworkUtils.getNetworkError(t))
            }
        })
    }

    private fun insertUserProfile(token: String, userId: String,
                                  username: String, fullname: String, email: String) {
        val userMap = mapOf(
            "user_id"  to userId,
            "username" to username,
            "fullname" to fullname,
            "email"    to email,
            "role"     to "user"
        )

        SupabaseAuthClient.db.insertUser(
            token = "Bearer $token",
            user  = userMap
        ).enqueue(object : Callback<Void> {
            override fun onResponse(call: Call<Void>, response: Response<Void>) {
                setLoading(false)
                session.saveSession(token, userId, username, fullname, email)
                showSuccess()
            }

            override fun onFailure(call: Call<Void>, t: Throwable) {
                setLoading(false)
                // Still save session even if insert fails
                session.saveSession(token, userId, username, fullname, email)
                showSuccess()
            }
        })
    }

    private fun showSuccess() {
        binding.layoutForm.visibility    = View.GONE
        binding.layoutSuccess.visibility = View.VISIBLE
        binding.btnGoToDashboard.setOnClickListener {
            startActivity(Intent(this, com.aratkain.ui.dashboard.DashboardActivity::class.java))
            finishAffinity()
        }
    }

    private fun clearErrors() {
        binding.tilUsername.error        = null
        binding.tilFullname.error        = null
        binding.tilEmail.error           = null
        binding.tilPassword.error        = null
        binding.tilConfirmPassword.error = null
        binding.tvError.visibility       = View.GONE
    }

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility  = if (loading) View.VISIBLE else View.GONE
        binding.btnRegister.isEnabled   = !loading
        binding.btnRegister.text        = if (loading) "Creating account…" else "Create Account"
    }

    private fun showError(msg: String) {
        binding.tvError.text       = msg
        binding.tvError.visibility = View.VISIBLE
    }
}
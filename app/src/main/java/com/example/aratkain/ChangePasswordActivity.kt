package com.aratkain.ui.profile

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.aratkain.api.SupabaseAuthClient
import com.aratkain.api.SupabaseAuthResponse
import com.aratkain.databinding.ActivityChangePasswordBinding
import com.aratkain.utils.NetworkUtils
import com.aratkain.utils.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ChangePasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChangePasswordBinding
    private lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChangePasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = "Change Password"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        session = SessionManager(this)

        binding.btnUpdate.setOnClickListener { changePassword() }
    }

    private fun changePassword() {
        val newPassword = binding.etNewPassword.text.toString().trim()
        val confirmPassword = binding.etConfirmPassword.text.toString().trim()

        binding.tilNewPassword.error = null
        binding.tilConfirmPassword.error = null

        var valid = true
        if (newPassword.isEmpty()) {
            binding.tilNewPassword.error = "New password is required"
            valid = false
        } else if (newPassword.length < 6) {
            binding.tilNewPassword.error = "At least 6 characters"
            valid = false
        }
        if (newPassword != confirmPassword) {
            binding.tilConfirmPassword.error = "Passwords do not match"
            valid = false
        }
        if (!valid) return

        if (!NetworkUtils.isConnected(this)) {
            showError("No internet connection.")
            return
        }

        setLoading(true)

        val body = mapOf("password" to newPassword)

        SupabaseAuthClient.auth.updatePassword(
            token = session.getBearerToken(),
            body = body
        ).enqueue(object : Callback<SupabaseAuthResponse> {
            override fun onResponse(
                call: Call<SupabaseAuthResponse>,
                response: Response<SupabaseAuthResponse>
            ) {
                setLoading(false)
                if (response.isSuccessful) {
                    showSuccess("Password updated successfully!")
                    binding.etNewPassword.text?.clear()
                    binding.etConfirmPassword.text?.clear()
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

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnUpdate.isEnabled = !loading
        binding.btnUpdate.text = if (loading) "Updating…" else "Update Password"
    }

    private fun showError(msg: String) {
        binding.tvError.text = msg
        binding.tvError.visibility = View.VISIBLE
        binding.tvSuccess.visibility = View.GONE
    }

    private fun showSuccess(msg: String) {
        binding.tvSuccess.text = msg
        binding.tvSuccess.visibility = View.VISIBLE
        binding.tvError.visibility = View.GONE
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
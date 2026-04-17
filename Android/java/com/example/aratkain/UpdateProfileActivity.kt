package com.aratkain.ui.profile

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.aratkain.api.SupabaseAuthClient
import com.aratkain.databinding.ActivityUpdateProfileBinding
import com.aratkain.utils.NetworkUtils
import com.aratkain.utils.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class UpdateProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityUpdateProfileBinding
    private lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityUpdateProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = "Update Profile"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        session = SessionManager(this)

        // Pre-fill current values
        binding.etUsername.setText(session.getUsername())
        binding.etFullname.setText(session.getFullname())

        binding.btnSave.setOnClickListener { saveProfile() }
    }

    private fun saveProfile() {
        val username = binding.etUsername.text.toString().trim()
        val fullname = binding.etFullname.text.toString().trim()

        binding.tilUsername.error = null
        binding.tilFullname.error = null

        var valid = true
        if (username.isEmpty()) { binding.tilUsername.error = "Username is required"; valid = false }
        else if (username.length < 3) { binding.tilUsername.error = "At least 3 characters"; valid = false }
        else if (!username.matches(Regex("^[a-zA-Z0-9_]+$"))) {
            binding.tilUsername.error = "Letters, numbers, underscores only"; valid = false
        }
        if (fullname.isEmpty()) { binding.tilFullname.error = "Full name is required"; valid = false }
        if (!valid) return

        if (!NetworkUtils.isConnected(this)) { showError("No internet connection."); return }

        setLoading(true)

        val userId = session.getUserId() ?: return
        val updates: Map<String, String> = mapOf("username" to username, "fullname" to fullname)

        SupabaseAuthClient.db.updateUser(
            token   = session.getBearerToken(),
            userId  = "eq.$userId",
            updates = updates
        ).enqueue(object : Callback<Void> {
            override fun onResponse(call: Call<Void>, response: Response<Void>) {
                setLoading(false)
                if (response.isSuccessful || response.code() == 204) {
                    session.updateProfile(username, fullname)
                    showSuccess("Profile updated successfully!")
                } else {
                    showError(NetworkUtils.parseError(response))
                }
            }

            override fun onFailure(call: Call<Void>, t: Throwable) {
                setLoading(false)
                showError(NetworkUtils.getNetworkError(t))
            }
        })
    }

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnSave.isEnabled      = !loading
        binding.btnSave.text           = if (loading) "Saving…" else "Save Changes"
    }

    private fun showError(msg: String) {
        binding.tvError.text       = msg
        binding.tvError.visibility = View.VISIBLE
        binding.tvSuccess.visibility = View.GONE
    }

    private fun showSuccess(msg: String) {
        binding.tvSuccess.text       = msg
        binding.tvSuccess.visibility = View.VISIBLE
        binding.tvError.visibility   = View.GONE
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
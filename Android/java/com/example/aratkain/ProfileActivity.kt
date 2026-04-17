package com.aratkain.ui.profile

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.aratkain.databinding.ActivityProfileBinding
import com.aratkain.utils.SessionManager
import com.bumptech.glide.Glide
import com.aratkain.R

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private lateinit var session: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.title = "My Profile"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        session = SessionManager(this)

        binding.btnUpdateProfile.setOnClickListener {
            startActivity(Intent(this, UpdateProfileActivity::class.java))
        }

        binding.btnChangePassword.setOnClickListener {
            startActivity(Intent(this, ChangePasswordActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        loadProfile()
    }

    private fun loadProfile() {
        val username = session.getUsername() ?: ""
        val fullname = session.getFullname() ?: ""
        val email    = session.getEmail()    ?: ""
        val photoUrl = session.getPhotoUrl()

        binding.tvUsername.text = "@$username"
        binding.tvFullname.text = fullname
        binding.tvEmail.text    = email

        val initials = if (fullname.isNotEmpty())
            fullname.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString("")
        else username.take(2).uppercase()

        binding.tvInitials.text = initials.uppercase()

        if (!photoUrl.isNullOrEmpty()) {
            Glide.with(this)
                .load(photoUrl)
                .placeholder(R.drawable.ic_avatar_placeholder)
                .circleCrop()
                .into(binding.ivAvatar)
            binding.tvInitials.visibility = android.view.View.GONE
            binding.ivAvatar.visibility   = android.view.View.VISIBLE
        } else {
            binding.tvInitials.visibility = android.view.View.VISIBLE
            binding.ivAvatar.visibility   = android.view.View.GONE
        }
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
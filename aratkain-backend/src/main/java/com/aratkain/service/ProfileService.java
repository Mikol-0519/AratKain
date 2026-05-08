package com.aratkain.service;

import com.aratkain.dto.AuthDtos.*;
import com.aratkain.entity.User;
import com.aratkain.exception.AuthException.*;
import com.aratkain.repository.UserRepository;
import com.aratkain.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil         jwtUtil;

    // ── Get profile ───────────────────────────────────────────
    public ProfileResponse getProfile(String email) {
        User user = getUser(email);
        return toProfileResponse(user);
    }

    // ── Update profile ────────────────────────────────────────
    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = getUser(email);

        // Check username uniqueness (only if changed)
        if (!user.getUsername().equals(request.getUsername()) &&
                userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException(
                    "Username '" + request.getUsername() + "' is already taken");
        }

        user.setUsername(request.getUsername());
        user.setFullname(request.getFullname());
        userRepository.save(user);

        return toProfileResponse(user);
    }

    // ── Change password ───────────────────────────────────────
    public MessageResponse changePassword(String email, ChangePasswordRequest request) {
        User user = getUser(email);

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return MessageResponse.builder()
                .message("Password updated successfully!")
                .success(true)
                .build();
    }

    // ── Helper ────────────────────────────────────────────────
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UserNotFoundException("User not found"));
    }

    private ProfileResponse toProfileResponse(User user) {
        return ProfileResponse.builder()
                .userId(user.getUserId().toString())
                .username(user.getUsername())
                .fullname(user.getFullname())
                .email(user.getEmail())
                .role(user.getRole())
                .photoUrl(user.getPhotoUrl())
                .createdAt(user.getCreatedAt() != null ?
                        user.getCreatedAt().toString() : null)
                .build();
    }
}
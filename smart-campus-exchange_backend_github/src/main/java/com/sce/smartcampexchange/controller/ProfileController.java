package com.sce.smartcampexchange.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.sce.smartcampexchange.dto.ChangePasswordRequest;
import com.sce.smartcampexchange.dto.ProfileResponseDTO;
import com.sce.smartcampexchange.dto.UpdateMobileDTO;
import com.sce.smartcampexchange.service.ProfileService;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(
            ProfileService profileService) {

        this.profileService =
                profileService;
    }

    // -----------------------------------------
    // GET PROFILE
    // -----------------------------------------

    @GetMapping("/me")
    public ProfileResponseDTO getProfile(
            Authentication authentication) {

        String email =
                authentication.getName();

        return profileService
                .getProfile(email);
    }

    // -----------------------------------------
    // UPDATE MOBILE NUMBER
    // -----------------------------------------

    @PutMapping("/mobile")
    public ProfileResponseDTO updateMobile(
            Authentication authentication,
            @RequestBody UpdateMobileDTO request) {

        String email =
                authentication.getName();

        return profileService.updateMobile(
                email,
                request.getMobileNumber());
    }

    // -----------------------------------------
    // UPDATE PROFILE IMAGE
    // -----------------------------------------

    @PutMapping("/image")
    public ProfileResponseDTO updateImage(
            Authentication authentication,
            @RequestParam("file")
            MultipartFile file) {

        String email =
                authentication.getName();

        return profileService
                .updateProfileImage(
                        email,
                        file);
    }

    // -----------------------------------------
    // CHANGE PASSWORD
    // -----------------------------------------

    @PutMapping("/change-password")
    public String changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request) {

        String email =
                authentication.getName();

        return profileService.changePassword(
                email,
                request);
    }
}
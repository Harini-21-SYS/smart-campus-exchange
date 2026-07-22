package com.sce.smartcampexchange.service;

import com.sce.smartcampexchange.dto.ProfileResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface ProfileService {

    ProfileResponseDTO getProfile(String email);

    ProfileResponseDTO updateMobile(
            String email,
            String mobileNumber);
    ProfileResponseDTO updateProfileImage(
            String email,
            MultipartFile file);
}
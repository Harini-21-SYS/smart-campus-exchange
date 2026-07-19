package com.sce.smartcampexchange.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sce.smartcampexchange.entity.OtpVerification;

@Repository
public interface OtpVerificationRepository
        extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification>
        findTopByEmailOrderByOtpIdDesc(String email);

    Optional<OtpVerification>
        findByEmailAndOtp(String email, String otp);
}
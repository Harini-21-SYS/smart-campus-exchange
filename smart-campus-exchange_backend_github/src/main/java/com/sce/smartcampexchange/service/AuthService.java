package com.sce.smartcampexchange.service;

import java.util.Optional;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.sce.smartcampexchange.dto.LoginRequest;
import com.sce.smartcampexchange.dto.LoginResponse;
import com.sce.smartcampexchange.dto.OtpVerificationRequest;
import com.sce.smartcampexchange.dto.RegisterRequest;
import com.sce.smartcampexchange.entity.PendingRegistration;
import com.sce.smartcampexchange.entity.Student;
import com.sce.smartcampexchange.enums.Role;
import com.sce.smartcampexchange.repository.PendingRegistrationRepository;
import com.sce.smartcampexchange.repository.StudentRepository;
import com.sce.smartcampexchange.util.CollegeEmailValidator;
import com.sce.smartcampexchange.security.JwtUtil;

import com.sce.smartcampexchange.dto.ForgotPasswordRequest;
import com.sce.smartcampexchange.dto.VerifyForgotOtpRequest;
import com.sce.smartcampexchange.dto.ResetPasswordRequest;
import com.sce.smartcampexchange.entity.TrustScore;
import com.sce.smartcampexchange.repository.TrustScoreRepository;

@Service
public class AuthService {


private final StudentRepository studentRepository;

private final PendingRegistrationRepository
        pendingRegistrationRepository;

private final OtpService otpService;

private final BCryptPasswordEncoder
        passwordEncoder;

private final JwtUtil jwtUtil;

private final TrustScoreRepository trustScoreRepository;

public AuthService(
        StudentRepository studentRepository,
        PendingRegistrationRepository pendingRegistrationRepository,
        OtpService otpService,
        BCryptPasswordEncoder passwordEncoder,
        JwtUtil jwtUtil,TrustScoreRepository trustScoreRepository) {
	
	

    this.studentRepository =
            studentRepository;

    this.pendingRegistrationRepository =
            pendingRegistrationRepository;

    this.otpService =
            otpService;

    this.passwordEncoder =
            passwordEncoder;

    this.jwtUtil =
            jwtUtil;
    
    this.trustScoreRepository =
            trustScoreRepository;
    
}

// FIX: this method used to `return "Email already registered"` as a
// plain string on failure, which AuthController then wrapped in
// ApiResponse(true, message) — always true, regardless of what the
// message said. That's why a duplicate register number (which had no
// check here at all) sailed straight through to a successful OTP send,
// and even the duplicate-email case only ever "worked" because the
// frontend was pattern-matching the message text as a workaround.
//
// Now throws RuntimeException on every failure path instead, which
// AuthController explicitly catches and turns into success:false —
// see the corrected AuthController below.
public String register(
        RegisterRequest request) {

	CollegeEmailValidator.validate(
	        request.getCollegeEmail());

    if (studentRepository.existsByCollegeEmail(
            request.getCollegeEmail())) {

        throw new RuntimeException("Email already registered");
    }

    // FIX: this check did not exist before. StudentRepository already
    // had existsByRegisterNumber() defined — it just was never called
    // here, which is exactly why a duplicate register number registered
    // successfully.
    if (studentRepository.existsByRegisterNumber(
            request.getRegisterNumber())) {

        throw new RuntimeException("Register number already registered");
    }

    if (!request.getPassword().equals(
            request.getConfirmPassword())) {

        throw new RuntimeException("Passwords do not match");
    }

    Optional<PendingRegistration>
            existingPending =

            pendingRegistrationRepository
            .findByCollegeEmail(
                    request.getCollegeEmail());

    if (existingPending.isPresent()) {

        pendingRegistrationRepository
                .delete(existingPending.get());
    }

    PendingRegistration pending =
            new PendingRegistration();

    pending.setFullName(
            request.getFullName());

    pending.setCollegeEmail(
            request.getCollegeEmail());

    pending.setRegisterNumber(
            request.getRegisterNumber());

    pending.setDepartment(
            request.getDepartment());
    

    pending.setMobileNumber(
            request.getMobileNumber());

    pending.setPassword(
            passwordEncoder.encode(
                    request.getPassword()));

    pendingRegistrationRepository
            .save(pending);

    otpService.generateAndSendOtp(
            request.getCollegeEmail());

    return "OTP Sent Successfully";
}

// FIX: same bug as register() — `return "Invalid OTP"` on failure was
// being wrapped as success:true by the controller. Now throws instead,
// caught explicitly by AuthController.
public String verifyOtp(
        OtpVerificationRequest request) {

    boolean otpVerified =
            otpService.verifyOtp(
                    request.getEmail(),
                    request.getOtp());

    if (!otpVerified) {

        throw new RuntimeException("Invalid OTP");
    }

    Optional<PendingRegistration>
            pendingRecord =

            pendingRegistrationRepository
            .findByCollegeEmail(
                    request.getEmail());

    if (pendingRecord.isEmpty()) {

        throw new RuntimeException("Registration data not found");
    }

    PendingRegistration pending =
            pendingRecord.get();

    Student student =
            new Student();

    student.setFullName(
            pending.getFullName());

    student.setCollegeEmail(
            pending.getCollegeEmail());

    student.setRegisterNumber(
            pending.getRegisterNumber());

    student.setDepartment(
            pending.getDepartment());
    

    student.setMobileNumber(
            pending.getMobileNumber());

    student.setPassword(
            pending.getPassword());

    student.setEmailVerified(true);

    student.setAccountEnabled(true);

    student.setRole(Role.STUDENT);

    studentRepository.save(student);

    TrustScore trustScore =
            new TrustScore();

    trustScore.setStudent(student);
    trustScore.setScore(50.0);

    trustScoreRepository.save(trustScore);
    
    pendingRegistrationRepository
            .delete(pending);

    return "Registration Successful";
}

public String resendOtp(String email) {

    CollegeEmailValidator.validate(email);

    Optional<PendingRegistration> pendingRecord =
            pendingRegistrationRepository
            .findByCollegeEmail(email);

    if (pendingRecord.isEmpty()) {

        throw new RuntimeException(
                "Registration data not found");
    }

    otpService.generateAndSendOtp(email);

    return "OTP Resent Successfully";
}

public String forgotPassword(
        ForgotPasswordRequest request) {

    CollegeEmailValidator.validate(
            request.getEmail());

    Optional<Student> studentRecord =
            studentRepository
            .findByCollegeEmail(
                    request.getEmail());

    if (studentRecord.isEmpty()) {

        throw new RuntimeException(
                "Email not registered");
    }

    otpService.generateAndSendOtp(
            request.getEmail());

    return "OTP Sent Successfully";
}

public String verifyForgotOtp(
        VerifyForgotOtpRequest request) {

    boolean otpVerified =
            otpService.verifyOtp(
                    request.getEmail(),
                    request.getOtp());

    if (!otpVerified) {

        throw new RuntimeException(
                "Invalid OTP");
    }

    return "OTP Verified Successfully";
}
public String resetPassword(
        ResetPasswordRequest request) {

    if (!request.getNewPassword()
            .equals(
                    request.getConfirmPassword())) {

        throw new RuntimeException(
                "Passwords do not match");
    }

    Student student =
            studentRepository
            .findByCollegeEmail(
                    request.getEmail())
            .orElseThrow(() ->
                    new RuntimeException(
                            "Email not registered"));

    student.setPassword(
            passwordEncoder.encode(
                    request.getNewPassword()));

    studentRepository.save(student);

    return "Password Reset Successful";
}


public LoginResponse login(
        LoginRequest request) {

    CollegeEmailValidator.validate(
            request.getCollegeEmail());

    Optional<Student> studentRecord =

            studentRepository
            .findByCollegeEmail(
                    request.getCollegeEmail());

    if (studentRecord.isEmpty()) {

    	throw new RuntimeException(
    	        "Email not registered");
    }

    Student student =
            studentRecord.get();

    if (!passwordEncoder.matches(
            request.getPassword(),
            student.getPassword())) {

    	throw new RuntimeException(
    	        "Invalid Password");
    }

    if (!student.isEmailVerified()) {

    	throw new RuntimeException(
    	        "Email not verified");
    }

    // FIX: previously just threw "Account Disabled" with no context,
    // so a blocked student had no idea why. Now embeds the admin's
    // stored reason (Student.blockReason, set by
    // AdminService.blockStudent()) into the thrown message behind an
    // ACCOUNT_BLOCKED:: prefix, which Auth.jsx detects and parses out
    // to show in a dedicated "Account Blocked" modal instead of a
    // generic toast. This reuses the existing error.response.data.message
    // channel that every other login failure here already relies on —
    // see the note in the chat reply about why, since this file alone
    // doesn't show how that message reaches the frontend.
    if (!student.isAccountEnabled()) {

        String reason = student.getBlockReason();
        String reasonText =
                (reason != null && !reason.trim().isEmpty())
                        ? reason.trim()
                        : "No reason was provided.";

        throw new RuntimeException("ACCOUNT_BLOCKED::" + reasonText);
    }

    String token =
            jwtUtil.generateToken(
                    student.getCollegeEmail());

    return new LoginResponse(
            token,
            student.getCollegeEmail(),
            student.getRole().name());
}
}
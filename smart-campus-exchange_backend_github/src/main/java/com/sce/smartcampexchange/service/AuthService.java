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
public String register(
        RegisterRequest request) {

	CollegeEmailValidator.validate(
	        request.getCollegeEmail());
    if (studentRepository.existsByCollegeEmail(
            request.getCollegeEmail())) {

        return "Email already registered";
    }

    if (!request.getPassword().equals(
            request.getConfirmPassword())) {

        return "Passwords do not match";
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

public String verifyOtp(
        OtpVerificationRequest request) {

    boolean otpVerified =
            otpService.verifyOtp(
                    request.getEmail(),
                    request.getOtp());

    if (!otpVerified) {

        return "Invalid OTP";
    }

    Optional<PendingRegistration>
            pendingRecord =

            pendingRegistrationRepository
            .findByCollegeEmail(
                    request.getEmail());

    if (pendingRecord.isEmpty()) {

        return "Registration data not found";
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

    if (!student.isAccountEnabled()) {

        throw new RuntimeException(
                "Account Disabled");
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

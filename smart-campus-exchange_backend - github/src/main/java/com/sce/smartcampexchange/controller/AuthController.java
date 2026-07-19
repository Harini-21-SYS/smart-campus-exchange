package com.sce.smartcampexchange.controller;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import com.sce.smartcampexchange.dto.ApiResponse;
import com.sce.smartcampexchange.dto.LoginRequest;

import com.sce.smartcampexchange.dto.OtpVerificationRequest;
import com.sce.smartcampexchange.dto.RegisterRequest;
import com.sce.smartcampexchange.service.AuthService;
import com.sce.smartcampexchange.dto.LoginResponse;
import jakarta.validation.Valid;

import com.sce.smartcampexchange.dto.ForgotPasswordRequest;
import com.sce.smartcampexchange.dto.VerifyForgotOtpRequest;
import com.sce.smartcampexchange.dto.ResetPasswordRequest;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(
            AuthService authService) {

        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(

            @Valid
            @RequestBody
            RegisterRequest request) {

        String message =
                authService.register(request);

        return ResponseEntity.ok(
                new ApiResponse(true, message));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(

            @Valid
            @RequestBody
            OtpVerificationRequest request) {

        String message =
                authService.verifyOtp(request);

        return ResponseEntity.ok(
                new ApiResponse(true, message));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse> resendOtp(

            @RequestParam String email) {

    	  System.out.println("RESEND OTP API HIT");
    	
        String message =
                authService.resendOtp(email);

        return ResponseEntity.ok(
                new ApiResponse(true, message));
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(

            @Valid
            @RequestBody
            ForgotPasswordRequest request) {

        String message =
                authService.forgotPassword(request);

        return ResponseEntity.ok(
                new ApiResponse(true, message));
    }
    
    @PostMapping("/verify-forgot-otp")
    public ResponseEntity<ApiResponse> verifyForgotOtp(

            @Valid
            @RequestBody
            VerifyForgotOtpRequest request) {

        String message =
                authService.verifyForgotOtp(request);

        return ResponseEntity.ok(
                new ApiResponse(true, message));
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(

            @Valid
            @RequestBody
            ResetPasswordRequest request) {

        String message =
                authService.resetPassword(request);

        return ResponseEntity.ok(
                new ApiResponse(true, message));
    }
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(

            @Valid
            @RequestBody
            LoginRequest request) {

        LoginResponse response =
                authService.login(request);

        return ResponseEntity.ok(response);
    }
}
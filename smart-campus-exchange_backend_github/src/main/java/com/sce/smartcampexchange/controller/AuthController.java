package com.sce.smartcampexchange.controller;

import org.springframework.http.HttpStatus;
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

    // FIX: register() in AuthService now throws RuntimeException on
    // failure (duplicate email, duplicate register number, password
    // mismatch) instead of returning a plain failure string. Previously
    // this endpoint did `return ResponseEntity.ok(new ApiResponse(true,
    // message))` unconditionally — meaning EVERY failure message,
    // including "Email already registered", was still reported to the
    // frontend as success:true. This explicit try/catch is what actually
    // turns a thrown failure into success:false with a non-2xx status,
    // without depending on a possibly-nonexistent global exception
    // handler elsewhere in the project.
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(

            @Valid
            @RequestBody
            RegisterRequest request) {

        try {
            String message = authService.register(request);
            return ResponseEntity.ok(new ApiResponse(true, message));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // FIX: same issue as register() — verifyOtp() now throws on an
    // invalid/expired OTP or missing registration data, and this catch
    // block is what turns that into success:false instead of the
    // previous "return ResponseEntity.ok(new ApiResponse(true, message))"
    // regardless of outcome.
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(

            @Valid
            @RequestBody
            OtpVerificationRequest request) {

        try {
            String message = authService.verifyOtp(request);
            return ResponseEntity.ok(new ApiResponse(true, message));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, e.getMessage()));
        }
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
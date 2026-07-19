package com.sce.smartcampexchange.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class OtpVerificationRequest {


@NotBlank(message = "Email is required")
@Email(message = "Invalid Email")
private String email;

@NotBlank(message = "OTP is required")
private String otp;

public OtpVerificationRequest() {
}

public String getEmail() {
    return email;
}

public void setEmail(
        String email) {

    this.email = email;
}

public String getOtp() {
    return otp;
}

public void setOtp(
        String otp) {

    this.otp = otp;
}


}

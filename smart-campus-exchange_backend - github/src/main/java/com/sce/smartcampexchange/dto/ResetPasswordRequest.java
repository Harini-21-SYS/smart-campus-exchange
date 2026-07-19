package com.sce.smartcampexchange.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ResetPasswordRequest {


@NotBlank(message = "Email is required")
@Email(message = "Invalid Email")
private String email;

@NotBlank(message = "New Password is required")
private String newPassword;

@NotBlank(message = "Confirm Password is required")
private String confirmPassword;

public ResetPasswordRequest() {
}

public String getEmail() {
    return email;
}

public void setEmail(String email) {
    this.email = email;
}

public String getNewPassword() {
    return newPassword;
}

public void setNewPassword(String newPassword) {
    this.newPassword = newPassword;
}

public String getConfirmPassword() {
    return confirmPassword;
}

public void setConfirmPassword(String confirmPassword) {
    this.confirmPassword = confirmPassword;
}


}

package com.sce.smartcampexchange.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequest {


@NotBlank(message = "Email is required")
@Email(message = "Invalid Email")
private String email;

public ForgotPasswordRequest() {
}

public String getEmail() {
    return email;
}

public void setEmail(String email) {
    this.email = email;
}


}

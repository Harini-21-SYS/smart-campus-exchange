package com.sce.smartcampexchange.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {


@NotBlank(message = "Email is required")
@Email(message = "Invalid Email")
private String collegeEmail;

@NotBlank(message = "Password is required")
private String password;

public LoginRequest() {
}

public String getCollegeEmail() {
    return collegeEmail;
}

public void setCollegeEmail(
        String collegeEmail) {

    this.collegeEmail = collegeEmail;
}

public String getPassword() {
    return password;
}

public void setPassword(
        String password) {

    this.password = password;
}


}

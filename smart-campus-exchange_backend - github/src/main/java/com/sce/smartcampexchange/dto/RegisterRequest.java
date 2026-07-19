package com.sce.smartcampexchange.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RegisterRequest {


@NotBlank(message = "Full Name is required")
private String fullName;

@NotBlank(message = "College Email is required")
@Email(message = "Invalid email format")
private String collegeEmail;

@NotBlank(message = "Register Number is required")
private String registerNumber;

@NotBlank(message = "Department is required")
private String department;

@NotBlank(message = "Mobile Number is required")
private String mobileNumber;

@NotBlank(message = "Password is required")
private String password;

@NotBlank(message = "Confirm Password is required")
private String confirmPassword;

public RegisterRequest() {
}

public String getFullName() {
    return fullName;
}

public void setFullName(String fullName) {
    this.fullName = fullName;
}

public String getCollegeEmail() {
    return collegeEmail;
}

public void setCollegeEmail(String collegeEmail) {
    this.collegeEmail = collegeEmail;
}

public String getRegisterNumber() {
    return registerNumber;
}

public void setRegisterNumber(String registerNumber) {
    this.registerNumber = registerNumber;
}

public String getDepartment() {
    return department;
}

public void setDepartment(String department) {
    this.department = department;
}

public String getMobileNumber() {
    return mobileNumber;
}

public void setMobileNumber(String mobileNumber) {
    this.mobileNumber = mobileNumber;
}

public String getPassword() {
    return password;
}

public void setPassword(String password) {
    this.password = password;
}

public String getConfirmPassword() {
    return confirmPassword;
}

public void setConfirmPassword(String confirmPassword) {
    this.confirmPassword = confirmPassword;
}


}

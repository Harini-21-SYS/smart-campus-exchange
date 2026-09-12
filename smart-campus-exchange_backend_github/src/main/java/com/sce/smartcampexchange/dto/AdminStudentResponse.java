package com.sce.smartcampexchange.dto;

public class AdminStudentResponse {

    private Long studentId;

    private String fullName;

    private String collegeEmail;

    private String registerNumber;

    private String department;

    private String mobileNumber;

    private String profileImage;

    private String role;

    private boolean accountEnabled;

    private boolean emailVerified;

    public AdminStudentResponse() {
    }

    public AdminStudentResponse(
            Long studentId,
            String fullName,
            String collegeEmail,
            String registerNumber,
            String department,
            String mobileNumber,
            String profileImage,
            String role,
            boolean accountEnabled,
            boolean emailVerified) {

        this.studentId = studentId;
        this.fullName = fullName;
        this.collegeEmail = collegeEmail;
        this.registerNumber = registerNumber;
        this.department = department;
        this.mobileNumber = mobileNumber;
        this.profileImage = profileImage;
        this.role = role;
        this.accountEnabled = accountEnabled;
        this.emailVerified = emailVerified;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
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

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isAccountEnabled() {
        return accountEnabled;
    }

    public void setAccountEnabled(boolean accountEnabled) {
        this.accountEnabled = accountEnabled;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }
}
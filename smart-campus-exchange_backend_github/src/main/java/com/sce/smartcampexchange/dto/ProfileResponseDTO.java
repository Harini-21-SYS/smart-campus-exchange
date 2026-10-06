package com.sce.smartcampexchange.dto;

public class ProfileResponseDTO {

    private Long studentId;
    private String fullName;
    private String collegeEmail;
    private String registerNumber;
    private String department;
    private String mobileNumber;
    private String profileImage;
    private boolean emailVerified;
    private String year;

    // FIX: these two didn't exist before, which is why the trust
    // score on the profile page never changed — the frontend was
    // always falling through to its own hardcoded default because
    // this DTO never carried the real value at all. Populated from
    // TrustScoreService.getBreakdown() in ProfileServiceImpl.
    private double trustScore;
    private String trustLabel;

    public ProfileResponseDTO() {
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

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
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

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public double getTrustScore() {
        return trustScore;
    }

    public void setTrustScore(double trustScore) {
        this.trustScore = trustScore;
    }

    public String getTrustLabel() {
        return trustLabel;
    }

    public void setTrustLabel(String trustLabel) {
        this.trustLabel = trustLabel;
    }
}
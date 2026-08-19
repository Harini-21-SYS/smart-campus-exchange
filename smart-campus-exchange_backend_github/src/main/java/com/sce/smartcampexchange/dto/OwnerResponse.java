package com.sce.smartcampexchange.dto;

public class OwnerResponse {

    private Long studentId;
    private String fullName;
    private String department;
    private String profileImage;

    public OwnerResponse() {
    }

    public OwnerResponse(
            Long studentId,
            String fullName,
            String department,
            String profileImage) {

        this.studentId = studentId;
        this.fullName = fullName;
        this.department = department;
        this.profileImage = profileImage;
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

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }
}
package com.sce.smartcampexchange.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "pending_registrations")
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pendingId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String collegeEmail;

    @Column(nullable = false)
    private String registerNumber;

    @Column(nullable = false)
    private String department;
    
   
    @Column(nullable = false)
    private String mobileNumber;

    @Column(nullable = false)
    private String password;

    private LocalDateTime createdAt;

    // Default Constructor
    public PendingRegistration() {
    }

    // Parameterized Constructor
    public PendingRegistration(
            Long pendingId,
            String fullName,
            String collegeEmail,
            String registerNumber,
            String department,
            String mobileNumber,
            String password,
            LocalDateTime createdAt) {

        this.pendingId = pendingId;
        this.fullName = fullName;
        this.collegeEmail = collegeEmail;
        this.registerNumber = registerNumber;
        this.department = department;
        this.mobileNumber = mobileNumber;
        this.password = password;
        this.createdAt = createdAt;
    }

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getPendingId() {
        return pendingId;
    }

    public void setPendingId(Long pendingId) {
        this.pendingId = pendingId;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
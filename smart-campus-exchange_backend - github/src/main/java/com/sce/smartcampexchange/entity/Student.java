package com.sce.smartcampexchange.entity;

import java.time.LocalDateTime;

import com.sce.smartcampexchange.enums.Role;

import jakarta.persistence.*;

@Entity
@Table(name = "students")
public class Student {


@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long studentId;

@Column(nullable = false)
private String fullName;

@Column(nullable = false, unique = true)
private String collegeEmail;

@Column(nullable = false, unique = true)
private String registerNumber;

@Column(nullable = false)
private String department;

@Column(nullable = false, unique = true)
private String mobileNumber;

@Column(nullable = false)
private String password;

@Column(nullable = false)
private boolean emailVerified;

@Column(nullable = false)
private boolean accountEnabled;

@Enumerated(EnumType.STRING)
private Role role;

private LocalDateTime createdAt;

public Student() {
}

public Student(Long studentId, String fullName, String collegeEmail,
               String registerNumber, String department,
               String mobileNumber, String password,
               boolean emailVerified, boolean accountEnabled,
               Role role, LocalDateTime createdAt) {

    this.studentId = studentId;
    this.fullName = fullName;
    this.collegeEmail = collegeEmail;
    this.registerNumber = registerNumber;
    this.department = department;
    this.mobileNumber = mobileNumber;
    this.password = password;
    this.emailVerified = emailVerified;
    this.accountEnabled = accountEnabled;
    this.role = role;
    this.createdAt = createdAt;
}

@PrePersist
public void onCreate() {
    this.createdAt = LocalDateTime.now();
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

public String getPassword() {
    return password;
}

public void setPassword(String password) {
    this.password = password;
}

public boolean isEmailVerified() {
    return emailVerified;
}

public void setEmailVerified(boolean emailVerified) {
    this.emailVerified = emailVerified;
}

public boolean isAccountEnabled() {
    return accountEnabled;
}

public void setAccountEnabled(boolean accountEnabled) {
    this.accountEnabled = accountEnabled;
}

public Role getRole() {
    return role;
}

public void setRole(Role role) {
    this.role = role;
}

public LocalDateTime getCreatedAt() {
    return createdAt;
}

public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
}


}

package com.sce.smartcampexchange.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications")
public class Notification {

    // =========================================================
    // Primary Key
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notify_id")
    private Long notifyId;


    // =========================================================
    // Student
    // =========================================================

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;


    // =========================================================
    // Existing std_id column
    // =========================================================

    @Column(name = "std_id")
    private Long stdId;


    // =========================================================
    // Notification Type
    // =========================================================

    @Column(name = "notify_type")
    private String notifyType;


    // =========================================================
    // Recipient Type
    // =========================================================

    @Column(name = "recipient_type")
    private String recipientType;


    // =========================================================
    // Related ID
    // =========================================================

    @Column(name = "related_id")
    private Long relatedId;


    // =========================================================
    // Is Read
    // =========================================================

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;


    // =========================================================
    // Created At
    // =========================================================

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;


    // =========================================================
    // Constructor
    // =========================================================

    public Notification() {
    }


    // =========================================================
    // Before Insert
    // =========================================================

    @PrePersist
    protected void onCreate() {

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (isRead == null) {
            isRead = false;
        }
    }


    // =========================================================
    // Getters and Setters
    // =========================================================

    public Long getNotifyId() {
        return notifyId;
    }

    public void setNotifyId(Long notifyId) {
        this.notifyId = notifyId;
    }


    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }


    public Long getStdId() {
        return stdId;
    }

    public void setStdId(Long stdId) {
        this.stdId = stdId;
    }


    public String getNotifyType() {
        return notifyType;
    }

    public void setNotifyType(String notifyType) {
        this.notifyType = notifyType;
    }


    public String getRecipientType() {
        return recipientType;
    }

    public void setRecipientType(String recipientType) {
        this.recipientType = recipientType;
    }


    public Long getRelatedId() {
        return relatedId;
    }

    public void setRelatedId(Long relatedId) {
        this.relatedId = relatedId;
    }


    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
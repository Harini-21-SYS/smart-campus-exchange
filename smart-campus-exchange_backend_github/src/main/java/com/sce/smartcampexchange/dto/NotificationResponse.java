package com.sce.smartcampexchange.dto;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long notifyId;

    private Long studentId;

    private String notifyType;

    private String recipientType;

    private Long relatedId;

    private Boolean isRead;

    private LocalDateTime createdAt;


    // =========================================
    // CONSTRUCTOR
    // =========================================

    public NotificationResponse(

            Long notifyId,

            Long studentId,

            String notifyType,

            String recipientType,

            Long relatedId,

            Boolean isRead,

            LocalDateTime createdAt) {

        this.notifyId = notifyId;
        this.studentId = studentId;
        this.notifyType = notifyType;
        this.recipientType = recipientType;
        this.relatedId = relatedId;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }


    // =========================================
    // GETTERS
    // =========================================

    public Long getNotifyId() {
        return notifyId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getNotifyType() {
        return notifyType;
    }

    public String getRecipientType() {
        return recipientType;
    }

    public Long getRelatedId() {
        return relatedId;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
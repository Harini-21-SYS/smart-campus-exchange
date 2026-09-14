package com.sce.smartcampexchange.service;

public class StudentNotificationData {

    private Long studentId;

    private String recipientType;

    private String notifyType;

    private Long relatedId;


    public StudentNotificationData(
            Long studentId,
            String recipientType,
            String notifyType,
            Long relatedId) {

        this.studentId = studentId;
        this.recipientType = recipientType;
        this.notifyType = notifyType;
        this.relatedId = relatedId;
    }


    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }


    public String getRecipientType() {
        return recipientType;
    }

    public void setRecipientType(String recipientType) {
        this.recipientType = recipientType;
    }


    public String getNotifyType() {
        return notifyType;
    }

    public void setNotifyType(String notifyType) {
        this.notifyType = notifyType;
    }


    public Long getRelatedId() {
        return relatedId;
    }

    public void setRelatedId(Long relatedId) {
        this.relatedId = relatedId;
    }
}
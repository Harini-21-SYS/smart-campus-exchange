package com.sce.smartcampexchange.dto;

public class CreateComplaintRequest {

    // =========================================
    // COMPLETED TRANSACTION REQUEST ID
    // =========================================

    private Long requestId;


    // =========================================
    // COMPLAINT TYPE
    // =========================================

    private String complaintType;


    // =========================================
    // COMPLAINT DESCRIPTION
    // =========================================

    private String description;


    // =========================================
    // GETTERS AND SETTERS
    // =========================================

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }


    public String getComplaintType() {
        return complaintType;
    }

    public void setComplaintType(String complaintType) {
        this.complaintType = complaintType;
    }


    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
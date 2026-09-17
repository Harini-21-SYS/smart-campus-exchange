package com.sce.smartcampexchange.dto;

public class PurchaseComplaintRequest {

    private String complaintType;

    private String description;

    public PurchaseComplaintRequest() {
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
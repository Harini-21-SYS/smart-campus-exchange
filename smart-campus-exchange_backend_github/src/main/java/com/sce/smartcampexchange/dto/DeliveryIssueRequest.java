package com.sce.smartcampexchange.dto;

public class DeliveryIssueRequest {

    private String issueReason;

    private String description;


    public String getIssueReason() {
        return issueReason;
    }

    public void setIssueReason(String issueReason) {
        this.issueReason = issueReason;
    }


    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
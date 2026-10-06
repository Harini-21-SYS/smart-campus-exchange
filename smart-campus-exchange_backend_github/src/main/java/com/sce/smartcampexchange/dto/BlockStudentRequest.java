package com.sce.smartcampexchange.dto;

// Request body for PUT /api/admin/students/{id}/block.
// `reason` is required — AdminService.blockStudent() rejects a blank one.
public class BlockStudentRequest {

    private String reason;

    public BlockStudentRequest() {
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
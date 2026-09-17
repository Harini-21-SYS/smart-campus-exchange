package com.sce.smartcampexchange.dto;

import java.time.LocalDateTime;

public class ComplaintResponse {

    private Long complaintId;

    private Long studentId;
    private String studentName;

    private Long againstStudentId;
    private String againstStudentName;

    private Long productId;
    private String productTitle;
    private String productImage;

    private Long requestId;

    private String complaintType;
    private String description;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    // Shown to the complainant once the complaint is RESOLVED — the
    // admin's note on how it was handled.
    private String resolutionNote;

    // Shown to the student the complaint was raised against, only
    // when the admin issued a warning alongside resolving.
    private String warningNote;

    public ComplaintResponse(
            Long complaintId,
            Long studentId,
            String studentName,
            Long againstStudentId,
            String againstStudentName,
            Long productId,
            String productTitle,
            String productImage,
            Long requestId,
            String complaintType,
            String description,
            String status,
            LocalDateTime createdAt,
            LocalDateTime resolvedAt,
            String resolutionNote,
            String warningNote
    ) {
        this.complaintId = complaintId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.againstStudentId = againstStudentId;
        this.againstStudentName = againstStudentName;
        this.productId = productId;
        this.productTitle = productTitle;
        this.productImage = productImage;
        this.requestId = requestId;
        this.complaintType = complaintType;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
        this.resolutionNote = resolutionNote;
        this.warningNote = warningNote;
    }

    public Long getComplaintId() {
        return complaintId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public Long getAgainstStudentId() {
        return againstStudentId;
    }

    public String getAgainstStudentName() {
        return againstStudentName;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductTitle() {
        return productTitle;
    }

    public String getProductImage() {
        return productImage;
    }

    public Long getRequestId() {
        return requestId;
    }

    public String getComplaintType() {
        return complaintType;
    }

    public String getDescription() {
        return description;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public String getWarningNote() {
        return warningNote;
    }
}
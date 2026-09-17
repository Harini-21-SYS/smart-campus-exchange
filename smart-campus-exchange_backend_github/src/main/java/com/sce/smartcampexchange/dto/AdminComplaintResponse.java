package com.sce.smartcampexchange.dto;

import java.time.LocalDateTime;

public class AdminComplaintResponse {

    private Long complaintId;
    private Long productId;
    private String productTitle;
    private String productImage;
    private Long requestId;
    private String complaintType;
    private String description;
    private String status;
    private String resolutionNote;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    private Long studentId;
    private String studentName;
    private Long againstStudentId;
    private String againstStudentName;

    public AdminComplaintResponse() {
    }

    public AdminComplaintResponse(
            Long complaintId,
            Long productId,
            String productTitle,
            String productImage,
            Long requestId,
            String complaintType,
            String description,
            String status,
            String resolutionNote,
            LocalDateTime createdAt,
            LocalDateTime resolvedAt,
            Long studentId,
            String studentName,
            Long againstStudentId,
            String againstStudentName) {

        this.complaintId = complaintId;
        this.productId = productId;
        this.productTitle = productTitle;
        this.productImage = productImage;
        this.requestId = requestId;
        this.complaintType = complaintType;
        this.description = description;
        this.status = status;
        this.resolutionNote = resolutionNote;
        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
        this.studentId = studentId;
        this.studentName = studentName;
        this.againstStudentId = againstStudentId;
        this.againstStudentName = againstStudentName;
    }

    public Long getComplaintId() { return complaintId; }
    public Long getProductId() { return productId; }
    public String getProductTitle() { return productTitle; }
    public String getProductImage() { return productImage; }
    public Long getRequestId() { return requestId; }
    public String getComplaintType() { return complaintType; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public String getResolutionNote() { return resolutionNote; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public Long getStudentId() { return studentId; }
    public String getStudentName() { return studentName; }
    public Long getAgainstStudentId() { return againstStudentId; }
    public String getAgainstStudentName() { return againstStudentName; }
}
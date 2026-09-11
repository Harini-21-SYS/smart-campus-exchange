package com.sce.smartcampexchange.dto;

import java.time.LocalDateTime;

public class ComplaintResponse {

    // =========================================================
    // COMPLAINT ID
    // =========================================================

    private Long complaintId;


    // =========================================================
    // STUDENT WHO RAISED COMPLAINT
    // =========================================================

    private Long studentId;

    private String studentName;


    // =========================================================
    // STUDENT AGAINST WHOM COMPLAINT IS RAISED
    // =========================================================

    private Long againstStudentId;

    private String againstStudentName;


    // =========================================================
    // PRODUCT DETAILS
    // =========================================================

    private Long productId;

    private String productTitle;


    // =========================================================
    // REQUEST DETAILS
    // =========================================================

    private Long requestId;


    // =========================================================
    // COMPLAINT DETAILS
    // =========================================================

    private String complaintType;

    private String description;

    private String status;

    private String productImage;

    // =========================================================
    // DATES
    // =========================================================

    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

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
            LocalDateTime resolvedAt
    ) {

        this.complaintId = complaintId;

        this.studentId = studentId;
        this.studentName = studentName;

        this.againstStudentId = againstStudentId;
        this.againstStudentName = againstStudentName;

        this.productId = productId;
        this.productTitle = productTitle;

        this.productImage=productImage;
        this.requestId = requestId;

        this.complaintType = complaintType;
        this.description = description;
        this.status = status;

        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
    }


    // =========================================================
    // GETTERS
    // =========================================================

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
    public String getProductImage() {
        return productImage;
    }
}
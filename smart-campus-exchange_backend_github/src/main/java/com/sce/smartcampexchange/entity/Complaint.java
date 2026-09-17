package com.sce.smartcampexchange.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "complaint_table")
public class Complaint {

    // =========================================================
    // COMPLAINT ID
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "complaint_id")
    private Long complaintId;


    // =========================================================
    // STUDENT WHO RAISED THE COMPLAINT
    // =========================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "std_id",
            nullable = false
    )
    private Student student;


    // =========================================================
    // STUDENT AGAINST WHOM COMPLAINT IS RAISED
    // =========================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "against_std_id")
    private Student againstStudent;


    // =========================================================
    // RELATED PRODUCT
    // =========================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prd_id")
    private Product product;


    // =========================================================
    // RELATED REQUEST
    // =========================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "req_id")
    private Request request;


    // =========================================================
    // COMPLAINT TYPE
    //
    // Examples:
    // PRODUCT_NOT_RECEIVED
    // SELLER_DID_NOT_COME
    // WRONG_PRODUCT
    // DAMAGED_PRODUCT
    // SELLER_NOT_RESPONDING
    // OTHER
    // =========================================================

    @Column(
            name = "complaint_type",
            nullable = false,
            length = 50
    )
    private String complaintType;


    // =========================================================
    // COMPLAINT DETAILS
    // =========================================================

    @Column(
            name = "description",
            columnDefinition = "TEXT"
    )
    private String description;


    // =========================================================
    // STATUS
    //
    // PENDING
    // UNDER_REVIEW
    // RESOLVED
    // REJECTED
    // ESCALATED
    // =========================================================

    @Column(
            name = "status",
            nullable = false,
            length = 30
    )
    private String status;


    // =========================================================
    // CREATED TIME
    // =========================================================

    @Column(name = "created_at")
    private LocalDateTime createdAt;


    // =========================================================
    // RESOLVED TIME
    // =========================================================

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;


    // =========================================================
    // ADMIN RESOLUTION NOTE (visible to the complainant/buyer)
    // =========================================================

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;


    // =========================================================
    // ADMIN WARNING NOTE (visible to the student the complaint was
    // raised against — only set when the admin issues a warning
    // alongside resolving the complaint)
    // =========================================================

    @Column(name = "warning_note", columnDefinition = "TEXT")
    private String warningNote;


    // =========================================================
    // AUTO SET DEFAULT VALUES
    // =========================================================

    @PrePersist
    public void prePersist() {

        if (createdAt == null) {

            createdAt = LocalDateTime.now();
        }

        if (status == null ||
                status.isBlank()) {

            status = "PENDING";
        }
    }


    // =========================================================
    // GETTERS AND SETTERS
    // =========================================================

    public Long getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(Long complaintId) {
        this.complaintId = complaintId;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Student getAgainstStudent() {
        return againstStudent;
    }

    public void setAgainstStudent(
            Student againstStudent) {

        this.againstStudent =
                againstStudent;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Request getRequest() {
        return request;
    }

    public void setRequest(Request request) {
        this.request = request;
    }

    public String getComplaintType() {
        return complaintType;
    }

    public void setComplaintType(
            String complaintType) {

        this.complaintType =
                complaintType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description) {

        this.description =
                description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt) {

        this.createdAt =
                createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(
            LocalDateTime resolvedAt) {

        this.resolvedAt =
                resolvedAt;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public String getWarningNote() {
        return warningNote;
    }

    public void setWarningNote(String warningNote) {
        this.warningNote = warningNote;
    }
}
package com.sce.smartcampexchange.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "complaint_responses")
public class ComplaintReply {

    // =========================================================
    // RESPONSE ID
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Long responseId;


    // =========================================================
    // RELATED COMPLAINT
    // =========================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "complaint_id",
            nullable = false
    )
    private Complaint complaint;


    // =========================================================
    // RESPONSE TEXT
    // =========================================================

    @Column(
            name = "response_text",
            columnDefinition = "TEXT",
            nullable = false
    )
    private String responseText;


    // =========================================================
    // CREATED TIME
    // =========================================================

    @Column(name = "created_at")
    private LocalDateTime createdAt;


    // =========================================================
    // AUTO SET CREATED TIME
    // =========================================================

    @PrePersist
    public void prePersist() {

        if (createdAt == null) {

            createdAt = LocalDateTime.now();
        }
    }


    // =========================================================
    // GETTERS AND SETTERS
    // =========================================================

    public Long getResponseId() {
        return responseId;
    }

    public void setResponseId(Long responseId) {
        this.responseId = responseId;
    }

    public Complaint getComplaint() {
        return complaint;
    }

    public void setComplaint(Complaint complaint) {
        this.complaint = complaint;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(
            String responseText) {

        this.responseText = responseText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt) {

        this.createdAt = createdAt;
    }
}
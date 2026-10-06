package com.sce.smartcampexchange.dto;

import java.time.LocalDateTime;

public class TrustScoreResponse {

    private Long studentId;
    private String studentName;

    private double score;
    private String label;

    private Double averageRating;
    private int totalRatings;

    private int completedTransactions;
    private int upheldComplaints;
    private int pendingComplaints;
    private int deliveryIssues;

    private LocalDateTime updatedAt;

    public TrustScoreResponse(
            Long studentId,
            String studentName,
            double score,
            String label,
            Double averageRating,
            int totalRatings,
            int completedTransactions,
            int upheldComplaints,
            int pendingComplaints,
            int deliveryIssues,
            LocalDateTime updatedAt
    ) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.score = score;
        this.label = label;
        this.averageRating = averageRating;
        this.totalRatings = totalRatings;
        this.completedTransactions = completedTransactions;
        this.upheldComplaints = upheldComplaints;
        this.pendingComplaints = pendingComplaints;
        this.deliveryIssues = deliveryIssues;
        this.updatedAt = updatedAt;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public double getScore() {
        return score;
    }

    public String getLabel() {
        return label;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public int getTotalRatings() {
        return totalRatings;
    }

    public int getCompletedTransactions() {
        return completedTransactions;
    }

    public int getUpheldComplaints() {
        return upheldComplaints;
    }

    public int getPendingComplaints() {
        return pendingComplaints;
    }

    public int getDeliveryIssues() {
        return deliveryIssues;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
package com.sce.smartcampexchange.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "trust_scores")
public class TrustScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One student has one trust score
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "student_id",
        nullable = false,
        unique = true
    )
    private Student student;

    // Trust score value
    @Column(nullable = false)
    private double score = 50.0;

    // ---- Breakdown fields, cached alongside the score itself so the
    // profile page can show "why" without recomputing anything ----

    @Column(name = "average_rating")
    private Double averageRating;

    @Column(name = "total_ratings", nullable = false)
    private int totalRatings;

    @Column(name = "completed_transactions", nullable = false)
    private int completedTransactions;

    @Column(name = "upheld_complaints", nullable = false)
    private int upheldComplaints;

    @Column(name = "pending_complaints", nullable = false)
    private int pendingComplaints;

    @Column(name = "delivery_issues", nullable = false)
    private int deliveryIssues;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public TrustScore() {
    }

    public TrustScore(Student student, double score) {
        this.student = student;
        this.score = score;
    }

    @PrePersist
    @PreUpdate
    protected void onSave() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public int getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(int totalRatings) {
        this.totalRatings = totalRatings;
    }

    public int getCompletedTransactions() {
        return completedTransactions;
    }

    public void setCompletedTransactions(int completedTransactions) {
        this.completedTransactions = completedTransactions;
    }

    public int getUpheldComplaints() {
        return upheldComplaints;
    }

    public void setUpheldComplaints(int upheldComplaints) {
        this.upheldComplaints = upheldComplaints;
    }

    public int getPendingComplaints() {
        return pendingComplaints;
    }

    public void setPendingComplaints(int pendingComplaints) {
        this.pendingComplaints = pendingComplaints;
    }

    public int getDeliveryIssues() {
        return deliveryIssues;
    }

    public void setDeliveryIssues(int deliveryIssues) {
        this.deliveryIssues = deliveryIssues;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
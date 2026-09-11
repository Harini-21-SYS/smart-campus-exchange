package com.sce.smartcampexchange.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;

@Entity
@Table(name = "pickup_schedules")
public class PickupSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pickupId;


    @OneToOne
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;


    @Column(nullable = false)
    private String location;


    @Column(name = "pickup_date", nullable = false)
    private LocalDate pickupDate;


    @Column(name = "pickup_time", nullable = false)
    private LocalTime pickupTime;

    @Column(name = "reminder_sent")
    private boolean reminderSent = false;
    
    @Column(name = "buyer_confirmation_sent")
    private boolean buyerConfirmationSent = false;

    private String deliveryIssueReason;

    @Column(length = 1000)
    private String deliveryIssueDescription;
    
    private String status;


    private LocalDateTime deliveredAt;


    private LocalDateTime createdAt;


    private LocalDateTime updatedAt;

    private boolean reminderSent1 = false;

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();

        updatedAt = LocalDateTime.now();
    }


    @PreUpdate
    protected void onUpdate() {

        updatedAt = LocalDateTime.now();
    }


    // =========================
    // Getters / Setters
    // =========================

    public Long getPickupId() {
        return pickupId;
    }


    public void setPickupId(Long pickupId) {
        this.pickupId = pickupId;
    }


    public Request getRequest() {
        return request;
    }


    public void setRequest(Request request) {
        this.request = request;
    }


    public String getLocation() {
        return location;
    }


    public void setLocation(String location) {
        this.location = location;
    }


    public LocalDate getPickupDate() {
        return pickupDate;
    }


    public void setPickupDate(LocalDate pickupDate) {
        this.pickupDate = pickupDate;
    }


    public LocalTime getPickupTime() {
        return pickupTime;
    }


    public void setPickupTime(LocalTime pickupTime) {
        this.pickupTime = pickupTime;
    }


    public String getStatus() {
        return status;
    }


    public void setStatus(String status) {
        this.status = status;
    }


    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }


    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }


    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public boolean isReminderSent() {
        return reminderSent;
    }

    public void setReminderSent(boolean reminderSent) {
        this.reminderSent = reminderSent;
    }
    
    public boolean isBuyerConfirmationSent() {
        return buyerConfirmationSent;
    }

    public void setBuyerConfirmationSent(
            boolean buyerConfirmationSent) {

        this.buyerConfirmationSent =
                buyerConfirmationSent;
    }
    public String getDeliveryIssueReason() {
        return deliveryIssueReason;
    }

    public void setDeliveryIssueReason(
            String deliveryIssueReason) {

        this.deliveryIssueReason =
                deliveryIssueReason;
    }


    public String getDeliveryIssueDescription() {
        return deliveryIssueDescription;
    }

    public void setDeliveryIssueDescription(
            String deliveryIssueDescription) {

        this.deliveryIssueDescription =
                deliveryIssueDescription;
    }
    
}
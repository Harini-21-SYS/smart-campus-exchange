package com.sce.smartcampexchange.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class PickupScheduleResponse {

    private Long pickupId;

    private Long requestId;

    private Long productId;

    private String productTitle;

    private String productImage;

    private Long sellerId;

    private String sellerName;

    private String sellerDepartment;

    private Long requesterId;

    private String requesterName;

    private String requesterDepartment;

    private String location;

    private LocalDate pickupDate;

    private LocalTime pickupTime;

    private String status;

    private LocalDateTime deliveredAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    public PickupScheduleResponse(
            Long pickupId,
            Long requestId,
            Long productId,
            String productTitle,
            String productImage,
            Long sellerId,
            String sellerName,
            String sellerDepartment,
            Long requesterId,
            String requesterName,
            String requesterDepartment,
            String location,
            LocalDate pickupDate,
            LocalTime pickupTime,
            String status,
            LocalDateTime deliveredAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.pickupId = pickupId;
        this.requestId = requestId;
        this.productId = productId;
        this.productTitle = productTitle;
        this.productImage = productImage;
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.sellerDepartment = sellerDepartment;
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.requesterDepartment = requesterDepartment;
        this.location = location;
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
        this.status = status;
        this.deliveredAt = deliveredAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }


    public Long getPickupId() {
        return pickupId;
    }

    public Long getRequestId() {
        return requestId;
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

    public Long getSellerId() {
        return sellerId;
    }

    public String getSellerName() {
        return sellerName;
    }

    public String getSellerDepartment() {
        return sellerDepartment;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public String getRequesterDepartment() {
        return requesterDepartment;
    }

    public String getLocation() {
        return location;
    }

    public LocalDate getPickupDate() {
        return pickupDate;
    }

    public LocalTime getPickupTime() {
        return pickupTime;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
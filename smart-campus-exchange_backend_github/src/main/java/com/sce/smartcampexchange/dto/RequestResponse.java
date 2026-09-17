package com.sce.smartcampexchange.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class RequestResponse {

    private Long id;

    private Long productId;
    private String productTitle;
    private String productImage;

    private Long offeredProductId;
    private String offeredProductTitle;
    private String offeredProductImage;

    private Long sellerId;
    private String sellerName;

    private Long requesterId;
    private String requesterName;
    private String requesterDepartment;
    private String requesterRegisterNumber;

    private String requestType;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String pickupLocation;
    private LocalDate pickupDate;
    private LocalTime pickupTime;
    private String pickupStatus;

    // Only populated when pickupStatus is RESCHEDULE_REQUESTED — the
    // buyer's reason for asking for a different time, surfaced to the
    // seller in Incoming Requests.
    private String rescheduleReason;


    public RequestResponse(

            Long id,

            Long productId,
            String productTitle,
            String productImage,

            Long offeredProductId,
            String offeredProductTitle,
            String offeredProductImage,

            Long sellerId,
            String sellerName,

            Long requesterId,
            String requesterName,
            String requesterDepartment,
            String requesterRegisterNumber,

            String requestType,
            String status,

            LocalDateTime createdAt,
            LocalDateTime updatedAt,

            String pickupLocation,
            LocalDate pickupDate,
            LocalTime pickupTime,
            String pickupStatus,
            String rescheduleReason

    ) {

        this.id = id;

        this.productId = productId;
        this.productTitle = productTitle;
        this.productImage = productImage;

        this.offeredProductId = offeredProductId;
        this.offeredProductTitle = offeredProductTitle;
        this.offeredProductImage = offeredProductImage;

        this.sellerId = sellerId;
        this.sellerName = sellerName;

        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.requesterDepartment = requesterDepartment;
        this.requesterRegisterNumber = requesterRegisterNumber;

        this.requestType = requestType;
        this.status = status;

        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

        this.pickupLocation = pickupLocation;
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
        this.pickupStatus = pickupStatus;
        this.rescheduleReason = rescheduleReason;
    }


    public Long getId() {
        return id;
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

    public Long getOfferedProductId() {
        return offeredProductId;
    }

    public String getOfferedProductTitle() {
        return offeredProductTitle;
    }

    public String getOfferedProductImage() {
        return offeredProductImage;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public String getSellerName() {
        return sellerName;
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

    public String getRequesterRegisterNumber() {
        return requesterRegisterNumber;
    }

    public String getRequestType() {
        return requestType;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public LocalDate getPickupDate() {
        return pickupDate;
    }

    public LocalTime getPickupTime() {
        return pickupTime;
    }

    public String getPickupStatus() {
        return pickupStatus;
    }

    public String getRescheduleReason() {
        return rescheduleReason;
    }
}
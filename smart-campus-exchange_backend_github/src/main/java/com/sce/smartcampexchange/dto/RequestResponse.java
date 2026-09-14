package com.sce.smartcampexchange.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class RequestResponse {

    private Long id;

    // =========================================
    // REQUESTED PRODUCT
    // =========================================

    private Long productId;

    private String productTitle;

    private String productImage;


    // =========================================
    // OFFERED PRODUCT
    // =========================================

    private Long offeredProductId;

    private String offeredProductTitle;

    private String offeredProductImage;


    // =========================================
    // SELLER
    // =========================================

    private Long sellerId;

    private String sellerName;


    // =========================================
    // REQUESTER
    // =========================================

    private Long requesterId;

    private String requesterName;

    // FIX: added so the frontend can show the requester's department
    // and derive their year (via the same register-number parsing
    // logic already used at registration) in the "View requester
    // profile" panel — neither existed on this DTO before.
    private String requesterDepartment;

    private String requesterRegisterNumber;


    // =========================================
    // REQUEST DETAILS
    // =========================================

    private String requestType;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    // =========================================
    // PICKUP DETAILS
    // =========================================

    private String pickupLocation;

    private LocalDate pickupDate;

    private LocalTime pickupTime;

    private String pickupStatus;


    // =========================================
    // CONSTRUCTOR
    // =========================================

    public RequestResponse(

            Long id,

            // Requested Product
            Long productId,
            String productTitle,
            String productImage,

            // Offered Product
            Long offeredProductId,
            String offeredProductTitle,
            String offeredProductImage,

            // Seller
            Long sellerId,
            String sellerName,

            // Requester
            Long requesterId,
            String requesterName,
            String requesterDepartment,
            String requesterRegisterNumber,

            // Request Details
            String requestType,
            String status,

            // Dates
            LocalDateTime createdAt,
            LocalDateTime updatedAt,

            // Pickup Details
            String pickupLocation,
            LocalDate pickupDate,
            LocalTime pickupTime,
            String pickupStatus

    ) {

        this.id = id;

        // Requested Product
        this.productId = productId;
        this.productTitle = productTitle;
        this.productImage = productImage;

        // Offered Product
        this.offeredProductId = offeredProductId;
        this.offeredProductTitle = offeredProductTitle;
        this.offeredProductImage = offeredProductImage;

        // Seller
        this.sellerId = sellerId;
        this.sellerName = sellerName;

        // Requester
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.requesterDepartment = requesterDepartment;
        this.requesterRegisterNumber = requesterRegisterNumber;

        // Request Details
        this.requestType = requestType;
        this.status = status;

        // Dates
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

        // Pickup Details
        this.pickupLocation = pickupLocation;
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
        this.pickupStatus = pickupStatus;
    }


    // =========================================
    // GETTERS
    // =========================================

    public Long getId() {
        return id;
    }


    // Requested Product

    public Long getProductId() {
        return productId;
    }

    public String getProductTitle() {
        return productTitle;
    }

    public String getProductImage() {
        return productImage;
    }


    // Offered Product

    public Long getOfferedProductId() {
        return offeredProductId;
    }

    public String getOfferedProductTitle() {
        return offeredProductTitle;
    }

    public String getOfferedProductImage() {
        return offeredProductImage;
    }


    // Seller

    public Long getSellerId() {
        return sellerId;
    }

    public String getSellerName() {
        return sellerName;
    }


    // Requester

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


    // Request Details

    public String getRequestType() {
        return requestType;
    }

    public String getStatus() {
        return status;
    }


    // Dates

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }


    // Pickup Details

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

}
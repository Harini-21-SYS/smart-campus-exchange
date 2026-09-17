package com.sce.smartcampexchange.dto;

import java.time.LocalDateTime;

// Deliberately lightweight — no accept/reject actions here since the
// admin only monitors requests, never actions them (that stays with
// buyer/seller per the existing student-side workflow).
public class AdminRequestSummaryResponse {

    private Long requestId;
    private String productTitle;
    private String requestType;
    private String status;
    private String requesterName; // "Buyer" in the UI
    private String sellerName;
    private LocalDateTime createdAt;

    // Pickup info — null until the seller has proposed a schedule.
    private String pickupLocation;
    private String pickupDate;
    private String pickupTime;

    public AdminRequestSummaryResponse() {
    }

    public AdminRequestSummaryResponse(
            Long requestId,
            String productTitle,
            String requestType,
            String status,
            String requesterName,
            String sellerName,
            LocalDateTime createdAt,
            String pickupLocation,
            String pickupDate,
            String pickupTime) {

        this.requestId = requestId;
        this.productTitle = productTitle;
        this.requestType = requestType;
        this.status = status;
        this.requesterName = requesterName;
        this.sellerName = sellerName;
        this.createdAt = createdAt;
        this.pickupLocation = pickupLocation;
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
    }

    public Long getRequestId() { return requestId; }
    public String getProductTitle() { return productTitle; }
    public String getRequestType() { return requestType; }
    public String getStatus() { return status; }
    public String getRequesterName() { return requesterName; }
    public String getSellerName() { return sellerName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getPickupLocation() { return pickupLocation; }
    public String getPickupDate() { return pickupDate; }
    public String getPickupTime() { return pickupTime; }
}
package com.sce.smartcampexchange.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Deliberately lightweight — no accept/reject actions here since the
// admin only monitors requests, never actions them (that stays with
// buyer/seller per the existing student-side workflow).
//
// UPDATE: added productId/productImage (the seller's product) and
// offeredProductId/offeredProductTitle/offeredProductImage (the
// buyer's offered product, EXCHANGE requests only) so the admin
// requests detail view can show images for both sides instead of
// just a bare product title. See AdminService.getAllRequests() for
// where these are populated.
public class AdminRequestSummaryResponse {

    private Long requestId;

    private Long productId;
    private String productTitle;
    private String productImage;
    // Only meaningful for BUY requests — null for EXCHANGE/DONATE,
    // and null if the product's price itself is null. Matches
    // Product.getPrice()'s actual return type (BigDecimal).
    private BigDecimal productPrice;

    // EXCHANGE only — null for BUY/DONATE requests, and null for
    // EXCHANGE requests where the offered product has since been
    // deleted.
    private Long offeredProductId;
    private String offeredProductTitle;
    private String offeredProductImage;

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
            Long productId,
            String productTitle,
            String productImage,
            BigDecimal productPrice,
            Long offeredProductId,
            String offeredProductTitle,
            String offeredProductImage,
            String requestType,
            String status,
            String requesterName,
            String sellerName,
            LocalDateTime createdAt,
            String pickupLocation,
            String pickupDate,
            String pickupTime) {

        this.requestId = requestId;
        this.productId = productId;
        this.productTitle = productTitle;
        this.productImage = productImage;
        this.productPrice = productPrice;
        this.offeredProductId = offeredProductId;
        this.offeredProductTitle = offeredProductTitle;
        this.offeredProductImage = offeredProductImage;
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
    public Long getProductId() { return productId; }
    public String getProductTitle() { return productTitle; }
    public String getProductImage() { return productImage; }
    public BigDecimal getProductPrice() { return productPrice; }
    public Long getOfferedProductId() { return offeredProductId; }
    public String getOfferedProductTitle() { return offeredProductTitle; }
    public String getOfferedProductImage() { return offeredProductImage; }
    public String getRequestType() { return requestType; }
    public String getStatus() { return status; }
    public String getRequesterName() { return requesterName; }
    public String getSellerName() { return sellerName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getPickupLocation() { return pickupLocation; }
    public String getPickupDate() { return pickupDate; }
    public String getPickupTime() { return pickupTime; }
}
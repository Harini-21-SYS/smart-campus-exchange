package com.sce.smartcampexchange.dto;

import java.time.LocalDateTime;

public class RequestResponse {

    private Long id;

    private Long productId;

    private String productTitle;

    private Long ownerId;

    private String ownerName;

    private Long requesterId;

    private String requesterName;

    private String reqType;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public RequestResponse() {
    }

    public RequestResponse(
            Long id,
            Long productId,
            String productTitle,
            Long ownerId,
            String ownerName,
            Long requesterId,
            String requesterName,
            String reqType,
            String status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.id = id;
        this.productId = productId;
        this.productTitle = productTitle;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.reqType = reqType;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public Long getOwnerId() {
        return ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public String getReqType() {
        return reqType;
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
}
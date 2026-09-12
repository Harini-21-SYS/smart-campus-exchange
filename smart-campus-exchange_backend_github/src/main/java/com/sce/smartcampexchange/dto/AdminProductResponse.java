package com.sce.smartcampexchange.dto;

import java.math.BigDecimal;
import java.util.List;

public class AdminProductResponse {

    private Long productId;
    private String title;
    private String description;
    private String category;
    private String type;
    private BigDecimal price;
    private String condition;
    private String status;
    private String ownerEmail;

    private Long ownerId;
    private String ownerName;
    private String ownerDepartment;
    private String ownerProfileImage;
    private List<AdminProductImageResponse> images;

    public AdminProductResponse() {
    }

    public AdminProductResponse(
            Long productId,
            String title,
            String description,
            String category,
            String type,
            BigDecimal price,
            String condition,
            String status,
            String ownerEmail,
            Long ownerId,
            String ownerName,
            String ownerDepartment,
            String ownerProfileImage,
            List<AdminProductImageResponse> images) {

        this.productId = productId;
        this.title = title;
        this.description = description;
        this.category = category;
        this.type = type;
        this.price = price;
        this.condition = condition;
        this.status = status;
        this.ownerEmail = ownerEmail;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.ownerDepartment = ownerDepartment;
        this.ownerProfileImage = ownerProfileImage;
        this.images = images;
    }

    public Long getProductId() {
        return productId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getCategory() {
        return category;
    }

    public String getType() {
        return type;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getCondition() {
        return condition;
    }

    public String getStatus() {
        return status;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public String getOwnerDepartment() {
        return ownerDepartment;
    }

    public String getOwnerProfileImage() {
        return ownerProfileImage;
    }

    public List<AdminProductImageResponse> getImages() {
        return images;
    }
}
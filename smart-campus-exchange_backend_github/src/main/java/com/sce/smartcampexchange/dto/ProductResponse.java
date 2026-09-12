package com.sce.smartcampexchange.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ProductResponse {

    private Long id;
    private Long ownerId;
    private String ownerName;
    private String ownerProfileImage;
    private Double trustScore;
    private String ownerDepartment;

    private String title;
    private String description;
    private String category;
    private String type;
    private BigDecimal price;
    private String condition;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<ProductImageResponse> images;

    public ProductResponse() {}

    public ProductResponse(Long id,
                           Long ownerId,
                           String ownerName,
                           String ownerProfileImage,
                           Double trustScore,
                           String ownerDepartment,
                           String title,
                           String description,
                           String category,
                           String type,
                           BigDecimal price,
                           String condition,
                           String status,
                           LocalDateTime createdAt,
                           LocalDateTime updatedAt,
                           List<ProductImageResponse> images) {
        this.id = id;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.ownerProfileImage = ownerProfileImage;
        this.trustScore = trustScore;
        this.ownerDepartment = ownerDepartment;
        this.title = title;
        this.description = description;
        this.category = category;
        this.type = type;
        this.price = price;
        this.condition = condition;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.images = images;
    }

    // Getters / Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getOwnerProfileImage() { return ownerProfileImage; }
    public void setOwnerProfileImage(String ownerProfileImage) { this.ownerProfileImage = ownerProfileImage; }

    public Double getTrustScore() { return trustScore; }
    public void setTrustScore(Double trustScore) { this.trustScore = trustScore; }

    public String getOwnerDepartment() { return ownerDepartment; }
    public void setOwnerDepartment(String ownerDepartment) { this.ownerDepartment = ownerDepartment; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<ProductImageResponse> getImages() { return images; }
    public void setImages(List<ProductImageResponse> images) { this.images = images; }
}
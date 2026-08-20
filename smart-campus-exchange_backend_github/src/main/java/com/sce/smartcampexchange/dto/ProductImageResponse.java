package com.sce.smartcampexchange.dto;

public class ProductImageResponse {

    private Long imageId;
    private String imageUrl;
    private boolean primary;

    public ProductImageResponse() {
    }

    public ProductImageResponse(
            Long imageId,
            String imageUrl,
            boolean primary) {

        this.imageId = imageId;
        this.imageUrl = imageUrl;
        this.primary = primary;
    }

    public Long getImageId() {
        return imageId;
    }

    public void setImageId(Long imageId) {
        this.imageId = imageId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isPrimary() {
        return primary;
    }

    public void setPrimary(boolean primary) {
        this.primary = primary;
    }
}
package com.sce.smartcampexchange.dto;

public class AdminProductImageResponse {

    private String imageUrl;
    private boolean primary;

    public AdminProductImageResponse() {
    }

    public AdminProductImageResponse(String imageUrl, boolean primary) {
        this.imageUrl = imageUrl;
        this.primary = primary;
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
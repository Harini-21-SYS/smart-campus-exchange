package com.sce.smartcampexchange.dto;

public class RatingRequest {

    private Integer rating;

    private String comment;

    public RatingRequest() {
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
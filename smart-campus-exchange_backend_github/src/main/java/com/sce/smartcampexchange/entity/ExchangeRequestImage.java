package com.sce.smartcampexchange.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "exchange_request_images")
public class ExchangeRequestImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne
    @JoinColumn(
            name = "request_id",
            nullable = false
    )
    private Request request;


    @Column(nullable = false)
    private String imageUrl;


    // =====================================
    // GETTERS AND SETTERS
    // =====================================

    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }


    public Request getRequest() {
        return request;
    }


    public void setRequest(Request request) {
        this.request = request;
    }


    public String getImageUrl() {
        return imageUrl;
    }


    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
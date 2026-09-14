package com.sce.smartcampexchange.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "requests")
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =========================================================
    // PRODUCT REQUESTED
    // Seller's product
    // =========================================================

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;


    // =========================================================
    // OFFERED PRODUCT
    // Requester's product for EXCHANGE
    // =========================================================

    @ManyToOne
    @JoinColumn(name = "offered_product_id")
    private Product offeredProduct;


    // =========================================================
    // SELLER
    // =========================================================

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private Student seller;


    // =========================================================
    // REQUESTER
    // =========================================================

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    private Student requester;


    // =========================================================
    // REQUEST TYPE
    // BUY / EXCHANGE
    // =========================================================

    @Column(name = "request_type", nullable = false)
    private String requestType;


    // =========================================================
    // STATUS
    // =========================================================

    @Column(name = "status", nullable = false)
    private String status;


    // =========================================================
    // DATES
    // =========================================================

    @Column(name = "created_at")
    private LocalDateTime createdAt;


    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();

        updatedAt = LocalDateTime.now();
    }


    @PreUpdate
    protected void onUpdate() {

        updatedAt = LocalDateTime.now();
    }


    // =========================================================
    // GETTERS AND SETTERS
    // =========================================================

    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }


    public Product getProduct() {
        return product;
    }


    public void setProduct(Product product) {
        this.product = product;
    }


    // OFFERED PRODUCT

    public Product getOfferedProduct() {
        return offeredProduct;
    }


    public void setOfferedProduct(Product offeredProduct) {
        this.offeredProduct = offeredProduct;
    }


    public Student getSeller() {
        return seller;
    }


    public void setSeller(Student seller) {
        this.seller = seller;
    }


    public Student getRequester() {
        return requester;
    }


    public void setRequester(Student requester) {
        this.requester = requester;
    }


    public String getRequestType() {
        return requestType;
    }


    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }


    public String getStatus() {
        return status;
    }


    public void setStatus(String status) {
        this.status = status;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }


    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
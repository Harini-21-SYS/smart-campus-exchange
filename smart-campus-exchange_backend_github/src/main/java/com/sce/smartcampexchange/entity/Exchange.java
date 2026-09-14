package com.sce.smartcampexchange.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "exch_table")
public class Exchange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exch_id")
    private Long exchangeId;

    // Exchange request
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "req_id", nullable = false, unique = true)
    private Request request;

    // Product offered by requester
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offered_prd_id", nullable = false)
    private Product offeredProduct;

    // PENDING / ACCEPTED / REJECTED / COMPLETED
    @Column(name = "status", length = 20, nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


    public Exchange() {
    }


    @PrePersist
    protected void onCreate() {

        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
    }


    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }


    public Long getExchangeId() {
        return exchangeId;
    }

    public void setExchangeId(Long exchangeId) {
        this.exchangeId = exchangeId;
    }


    public Request getRequest() {
        return request;
    }

    public void setRequest(Request request) {
        this.request = request;
    }


    public Product getOfferedProduct() {
        return offeredProduct;
    }

    public void setOfferedProduct(Product offeredProduct) {
        this.offeredProduct = offeredProduct;
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
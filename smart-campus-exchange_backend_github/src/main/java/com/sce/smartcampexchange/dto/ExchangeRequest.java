package com.sce.smartcampexchange.dto;

public class ExchangeRequest {

    private Long productId;

    private Long offeredProductId;


    public ExchangeRequest() {
    }


    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }


    public Long getOfferedProductId() {
        return offeredProductId;
    }

    public void setOfferedProductId(
            Long offeredProductId) {

        this.offeredProductId =
                offeredProductId;
    }
}
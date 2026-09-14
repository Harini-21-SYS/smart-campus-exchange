package com.sce.smartcampexchange.dto;

// Plain-ID payload the frontend can actually send. Replaces expecting
// the client to submit a full Request entity (with nested Product/
// Student objects), which Jackson has no way to construct — that's
// exactly what caused the "Cannot construct instance of ... Request"
// error.
public class CreateRequestRequest {

    private Long productId;
    private String requestType; // "BUY" | "EXCHANGE" | "DONATE" — optional, defaults to BUY
    private Long offeredProductId; // required only when requestType = EXCHANGE

    public CreateRequestRequest() {}

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public Long getOfferedProductId() {
        return offeredProductId;
    }

    public void setOfferedProductId(Long offeredProductId) {
        this.offeredProductId = offeredProductId;
    }
}
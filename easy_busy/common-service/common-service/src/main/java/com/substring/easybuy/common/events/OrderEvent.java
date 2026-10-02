package com.substring.easybuy.common.events;

import java.math.BigDecimal;

public class OrderEvent {
    private Long orderId;
    private String userId;
    private String email;
    private String status;
    private String message;
    private BigDecimal totalAmount;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    @Override
    public String toString() {
        return "OrderEvent{" +
                "orderId=" + orderId +
                ", userId='" + userId + '\'' +
                ", email='" + email + '\'' +
                ", status='" + status + '\'' +
                ", message='" + message + '\'' +
                ", totalAmount=" + totalAmount +
                '}';
    }
}


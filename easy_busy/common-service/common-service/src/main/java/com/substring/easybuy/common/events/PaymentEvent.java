package com.substring.easybuy.common.events;

import java.math.BigDecimal;

public class PaymentEvent {
    private Long orderId;
    private String transactionId;
    private BigDecimal amount;
    private String status; // PAID or FAILED
    private String message;

    public PaymentEvent() {
    }

    public PaymentEvent(Long orderId, String transactionId, BigDecimal amount, String status, String message) {
        this.orderId = orderId;
        this.transactionId = transactionId;
        this.amount = amount;
        this.status = status;
        this.message = message;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
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

    @Override
    public String toString() {
        return "PaymentEvent{" +
                "orderId=" + orderId +
                ", transactionId='" + transactionId + '\'' +
                ", amount=" + amount +
                ", status='" + status + '\'' +
                ", message='" + message + '\'' +
                '}';
    }
}

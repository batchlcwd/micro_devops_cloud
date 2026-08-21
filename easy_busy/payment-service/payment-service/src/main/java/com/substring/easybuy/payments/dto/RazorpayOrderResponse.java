package com.substring.easybuy.payments.dto;

import java.math.BigDecimal;

public record RazorpayOrderResponse(
    String razorpayOrderId,
    String transactionId,
    Long orderId,
    BigDecimal amount,
    String currency,
    String keyId
) {}

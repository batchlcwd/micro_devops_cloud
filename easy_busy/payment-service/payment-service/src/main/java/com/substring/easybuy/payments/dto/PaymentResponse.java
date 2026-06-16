package com.substring.easybuy.payments.dto;

import com.substring.easybuy.payments.entity.PaymentMethod;
import com.substring.easybuy.payments.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
    Long id,
    String transactionId,
    Long orderId,
    BigDecimal amount,
    PaymentMethod paymentMethod,
    PaymentStatus status,
    String paymentGatewayTxnId,
    Instant createdAt,
    Instant updatedAt
) {}

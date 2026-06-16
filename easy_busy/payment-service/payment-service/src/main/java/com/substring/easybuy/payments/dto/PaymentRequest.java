package com.substring.easybuy.payments.dto;

import com.substring.easybuy.payments.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record PaymentRequest(
    @NotNull(message = "Order ID is required") 
    Long orderId,
    
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive") 
    BigDecimal amount,
    
    @NotNull(message = "Payment method is required") 
    PaymentMethod paymentMethod,
    
    String paymentDetails
) {}

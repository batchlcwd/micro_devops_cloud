package com.substring.easybuy.payments.dto;

import jakarta.validation.constraints.NotBlank;

public record RazorpayVerificationRequest(
    @NotBlank(message = "Razorpay Order ID is required")
    String razorpayOrderId,
    
    @NotBlank(message = "Razorpay Payment ID is required")
    String razorpayPaymentId,
    
    @NotBlank(message = "Razorpay Signature is required")
    String razorpaySignature
) {}

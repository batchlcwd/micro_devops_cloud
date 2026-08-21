package com.substring.easybuy.payments.service;

import com.substring.easybuy.payments.dto.PaymentRequest;
import com.substring.easybuy.payments.dto.PaymentResponse;

import java.util.List;

import com.substring.easybuy.payments.dto.RazorpayOrderResponse;
import com.substring.easybuy.payments.dto.RazorpayVerificationRequest;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {
    PaymentResponse processPayment(PaymentRequest request);
    List<PaymentResponse> getPaymentsByOrderId(Long orderId);
    PaymentResponse getPaymentByTransactionId(String transactionId);
    
    RazorpayOrderResponse createRazorpayOrder(Long orderId, BigDecimal amount);
    PaymentResponse verifyRazorpayPayment(RazorpayVerificationRequest request);
}

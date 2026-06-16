package com.substring.easybuy.payments.service;

import com.substring.easybuy.payments.dto.PaymentRequest;
import com.substring.easybuy.payments.dto.PaymentResponse;

import java.util.List;

public interface PaymentService {
    PaymentResponse processPayment(PaymentRequest request);
    List<PaymentResponse> getPaymentsByOrderId(Long orderId);
    PaymentResponse getPaymentByTransactionId(String transactionId);

    //need other logic for payment:
    //business logic create
}

package com.substring.easybuy.payments.controller;

import com.substring.easybuy.payments.dto.PaymentRequest;
import com.substring.easybuy.payments.dto.PaymentResponse;
import com.substring.easybuy.payments.dto.RazorpayOrderResponse;
import com.substring.easybuy.payments.dto.RazorpayVerificationRequest;
import com.substring.easybuy.payments.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> processPayment(@Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.processPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/razorpay/create-order")
    public ResponseEntity<RazorpayOrderResponse> createRazorpayOrder(
            @RequestParam Long orderId,
            @RequestParam BigDecimal amount) {
        RazorpayOrderResponse response = paymentService.createRazorpayOrder(orderId, amount);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/razorpay/verify")
    public ResponseEntity<PaymentResponse> verifyRazorpayPayment(
            @Valid @RequestBody RazorpayVerificationRequest request) {
        PaymentResponse response = paymentService.verifyRazorpayPayment(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentsByOrderId(orderId));
    }

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<PaymentResponse> getPaymentByTransactionId(@PathVariable String transactionId) {
        return ResponseEntity.ok(paymentService.getPaymentByTransactionId(transactionId));
    }
}

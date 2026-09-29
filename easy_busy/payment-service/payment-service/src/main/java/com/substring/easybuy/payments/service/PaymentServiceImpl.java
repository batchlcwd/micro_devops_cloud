package com.substring.easybuy.payments.service;

import com.substring.easybuy.payments.dto.PaymentRequest;
import com.substring.easybuy.payments.dto.PaymentResponse;
import com.substring.easybuy.payments.dto.RazorpayOrderResponse;
import com.substring.easybuy.payments.dto.RazorpayVerificationRequest;
import com.substring.easybuy.payments.entity.PaymentMethod;
import com.substring.easybuy.payments.entity.PaymentStatus;
import com.substring.easybuy.payments.entity.Transaction;
import com.substring.easybuy.payments.exception.BusinessRuleException;
import com.substring.easybuy.payments.exception.ResourceNotFoundException;
import com.substring.easybuy.payments.repository.TransactionRepository;
import com.substring.easybuy.payments.producer.PaymentEventPublisher;
import com.substring.easybuy.common.events.PaymentEvent;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final TransactionRepository transactionRepository;
    private final PaymentEventPublisher paymentEventPublisher;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public PaymentServiceImpl(TransactionRepository transactionRepository, PaymentEventPublisher paymentEventPublisher) {
        this.transactionRepository = transactionRepository;
        this.paymentEventPublisher = paymentEventPublisher;
    }

    @Override
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processing payment for Order ID: {} with amount: {}", request.orderId(), request.amount());

        // Validate payment details
        if (request.paymentDetails() == null || request.paymentDetails().trim().isEmpty()) {
            throw new BusinessRuleException("Payment details (card/wallet info) are required");
        }

        Transaction transaction = new Transaction();
        transaction.setOrderId(request.orderId());
        transaction.setAmount(request.amount());
        transaction.setPaymentMethod(request.paymentMethod());
        transaction.setTransactionId(UUID.randomUUID().toString());

        // Standard simulation: check for fail keywords or specific mock failed card numbers
        String details = request.paymentDetails().toLowerCase();
        if (details.contains("fail") || details.contains("1111-1111-1111-1111") || details.contains("error")) {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setPaymentGatewayTxnId("GATEWAY-FAIL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            Transaction saved = transactionRepository.save(transaction);
            log.warn("Payment failed for Order ID: {}. Gateway Txn: {}", request.orderId(), saved.getPaymentGatewayTxnId());
            throw new BusinessRuleException("Payment failed via gateway: transaction declined");
        }

        //TODO: actual logic:---- payment gateway call karnge

        // Simulate successful payment processing
        transaction.setStatus(PaymentStatus.PAID);
        transaction.setPaymentGatewayTxnId("GATEWAY-PAID-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        transaction.setPaymentGatewaySignature("GATEWAY-SIGNATURE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        transaction.setPaymentGatewayOrderId("GATEWAY-ORDERID-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        Transaction saved = transactionRepository.save(transaction);
        log.info("Payment processed successfully for Order ID: {}. Txn ID: {}, Gateway Txn: {}", 
                request.orderId(), saved.getTransactionId(), saved.getPaymentGatewayTxnId());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByOrderId(Long orderId) {
        log.info("Fetching payments for Order ID: {}", orderId);
        return transactionRepository.findByOrderId(orderId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByTransactionId(String transactionId) {
        log.info("Fetching payment for Transaction ID: {}", transactionId);
        Transaction transaction = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for ID: " + transactionId));
        return toResponse(transaction);
    }

    @Override
    public RazorpayOrderResponse createRazorpayOrder(Long orderId, BigDecimal amount) {
        log.info("Creating Razorpay Order for Order ID: {} with amount: {}", orderId, amount);
        try {
            String razorpayOrderId;
            if (razorpayKeyId == null || razorpayKeyId.contains("rzp_test_3c1cR1Y1k1x1z1") || razorpayKeySecret.equals("dummy_secret")) {
                log.warn("Using dummy Razorpay credentials, simulating Razorpay Order creation");
                razorpayOrderId = "order_MOCK_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            } else {
                RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                // Razorpay amount is in paise (1 INR = 100 paise)
                int amountInPaise = amount.multiply(new BigDecimal("100")).intValue();
                
                JSONObject orderRequest = new JSONObject();
                orderRequest.put("amount", amountInPaise);
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", "receipt_order_" + orderId);
                
                com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
                razorpayOrderId = razorpayOrder.get("id");
            }

            Transaction transaction = new Transaction();
            transaction.setOrderId(orderId);
            transaction.setAmount(amount);
            transaction.setPaymentMethod(PaymentMethod.ONLINE);
            transaction.setTransactionId(UUID.randomUUID().toString());
            transaction.setStatus(PaymentStatus.PENDING);
            transaction.setPaymentGatewayOrderId(razorpayOrderId);
            
            Transaction saved = transactionRepository.save(transaction);
            log.info("Razorpay Order created in DB: {} for Order: {}", razorpayOrderId, orderId);
            
            return new RazorpayOrderResponse(
                razorpayOrderId,
                saved.getTransactionId(),
                orderId,
                amount,
                "INR",
                razorpayKeyId
            );
        } catch (RazorpayException e) {
            log.error("Error creating Razorpay Order", e);
            throw new BusinessRuleException("Failed to initiate payment with Razorpay: " + e.getMessage());
        }
    }

    @Override
    public PaymentResponse verifyRazorpayPayment(RazorpayVerificationRequest request) {
        log.info("Verifying Razorpay payment signature for Razorpay Order ID: {}", request.razorpayOrderId());
        
        Transaction transaction = transactionRepository.findByPaymentGatewayOrderId(request.razorpayOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for Razorpay Order ID: " + request.razorpayOrderId()));
            
        boolean isValid = false;
        if (request.razorpayOrderId().startsWith("order_MOCK_")) {
            log.info("Simulating verification success for mock Razorpay Order ID");
            isValid = true;
        } else {
            try {
                JSONObject options = new JSONObject();
                options.put("razorpay_order_id", request.razorpayOrderId());
                options.put("razorpay_payment_id", request.razorpayPaymentId());
                options.put("razorpay_signature", request.razorpaySignature());
                
                isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);
            } catch (Exception e) {
                log.error("Signature verification failed with exception", e);
            }
        }
        
        if (isValid) {
            transaction.setStatus(PaymentStatus.PAID);
            transaction.setPaymentGatewayTxnId(request.razorpayPaymentId());
            transaction.setPaymentGatewaySignature(request.razorpaySignature());
            Transaction saved = transactionRepository.save(transaction);
            
            log.info("Razorpay Payment verified successfully. Transaction updated to PAID.");
            
            // Publish success event to Kafka so Cart-Order service gets notified
            PaymentEvent paymentEvent = new PaymentEvent(
                saved.getOrderId(),
                saved.getTransactionId(),
                saved.getAmount(),
                "PAID",
                "Razorpay Payment Verified Successfully"
            );
            paymentEventPublisher.publishPaymentEvent(paymentEvent);
            
            return toResponse(saved);
        } else {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setPaymentGatewayTxnId(request.razorpayPaymentId());
            Transaction saved = transactionRepository.save(transaction);
            
            log.warn("Razorpay Payment signature verification failed. Transaction updated to FAILED.");
            
            // Publish failure event to Kafka
            PaymentEvent paymentEvent = new PaymentEvent(
                saved.getOrderId(),
                saved.getTransactionId(),
                saved.getAmount(),
                "FAILED",
                "Razorpay Payment Signature Verification Failed"
            );
            paymentEventPublisher.publishPaymentEvent(paymentEvent);
            
            throw new BusinessRuleException("Payment signature verification failed");
        }
    }

    private PaymentResponse toResponse(Transaction txn) {
        return new PaymentResponse(
                txn.getId(),
                txn.getTransactionId(),
                txn.getOrderId(),
                txn.getAmount(),
                txn.getPaymentMethod(),
                txn.getStatus(),
                txn.getPaymentGatewayTxnId(),
                txn.getCreatedAt(),
                txn.getUpdatedAt()
        );
    }
}

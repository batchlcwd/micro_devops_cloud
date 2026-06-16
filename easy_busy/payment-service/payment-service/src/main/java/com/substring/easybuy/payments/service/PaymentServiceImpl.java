package com.substring.easybuy.payments.service;

import com.substring.easybuy.payments.dto.PaymentRequest;
import com.substring.easybuy.payments.dto.PaymentResponse;
import com.substring.easybuy.payments.entity.PaymentStatus;
import com.substring.easybuy.payments.entity.Transaction;
import com.substring.easybuy.payments.exception.BusinessRuleException;
import com.substring.easybuy.payments.exception.ResourceNotFoundException;
import com.substring.easybuy.payments.repository.TransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final TransactionRepository transactionRepository;

    public PaymentServiceImpl(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
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

package com.substring.easybuy.payments.repository;

import com.substring.easybuy.payments.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByTransactionId(String transactionId);
    List<Transaction> findByOrderId(Long orderId);
    Optional<Transaction> findByPaymentGatewayOrderId(String paymentGatewayOrderId);
}

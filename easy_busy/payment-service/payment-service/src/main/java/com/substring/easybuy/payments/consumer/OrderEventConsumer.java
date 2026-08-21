package com.substring.easybuy.payments.consumer;

import com.substring.easybuy.common.events.OrderEvent;
import com.substring.easybuy.common.events.PaymentEvent;
import com.substring.easybuy.payments.dto.PaymentRequest;
import com.substring.easybuy.payments.dto.PaymentResponse;
import com.substring.easybuy.payments.entity.PaymentMethod;
import com.substring.easybuy.payments.producer.PaymentEventPublisher;
import com.substring.easybuy.payments.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
public class OrderEventConsumer {

    private final PaymentService paymentService;

    //side mein rakhte hai.
    private final PaymentEventPublisher paymentEventPublisher;


    private final String ORDER_TOPIC = "order-topic";


    public OrderEventConsumer(PaymentService paymentService, PaymentEventPublisher paymentEventPublisher) {
        this.paymentService = paymentService;
        this.paymentEventPublisher = paymentEventPublisher;
    }


    //This is very important for consumer.
    @KafkaListener(topics = ORDER_TOPIC, groupId = "payment-group")
    public void consumeOrderCreatedEvent(OrderEvent orderEvent) {
        log.info("Received OrderEvent from Kafka: {}", orderEvent);

        if (orderEvent.getOrderId() == null) {
            log.error("Received OrderEvent with null orderId");
            return;
        }

        try {
            PaymentRequest paymentRequest = new PaymentRequest(
                    orderEvent.getOrderId(),
                    orderEvent.getTotalAmount() != null ? orderEvent.getTotalAmount() : BigDecimal.ZERO,
                    PaymentMethod.ONLINE,
                    orderEvent.getMessage() != null ? orderEvent.getMessage() : "Kafka Order Event"
            );

            log.info("Processing payment via Kafka consumer for Order ID: {}", orderEvent.getOrderId());
            PaymentResponse paymentResponse = paymentService.processPayment(paymentRequest);

            // Publish success acknowledgment event
            PaymentEvent paymentEvent = new PaymentEvent(
                    paymentResponse.orderId(),
                    paymentResponse.transactionId(),
                    paymentResponse.amount(),
                    paymentResponse.status().name(),
                    "Payment processed successfully via Kafka consumer"
            );
            paymentEventPublisher.publishPaymentEvent(paymentEvent);

        } catch (Exception e) {
            log.error("Error processing payment via Kafka consumer for Order ID: {}", orderEvent.getOrderId(), e);

            // Publish failure acknowledgment event
            PaymentEvent paymentEvent = new PaymentEvent(
                    orderEvent.getOrderId(),
                    null,
                    orderEvent.getTotalAmount() != null ? orderEvent.getTotalAmount() : BigDecimal.ZERO,
                    "FAILED",
                    e.getMessage()
            );
            paymentEventPublisher.publishPaymentEvent(paymentEvent);
        }
    }
}

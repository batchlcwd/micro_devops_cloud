package com.substring.easybuy.notifications.consumer;

import com.substring.easybuy.common.events.OrderEvent;
import com.substring.easybuy.common.events.PaymentEvent;
import com.substring.easybuy.notifications.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationEventConsumer {

    private final NotificationService notificationService;

    public NotificationEventConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "order-topic", groupId = "notification-group")
    public void consumeOrderEvent(OrderEvent orderEvent) {
        log.info("Received OrderEvent in Notification Service: {}", orderEvent);
        if (orderEvent.getOrderId() == null) return;
        
        if ("CONFIRMED".equalsIgnoreCase(orderEvent.getStatus())) {
            String recipientEmail = orderEvent.getUserId();
            notificationService.sendOrderConfirmation(
                recipientEmail, 
                orderEvent.getOrderId(), 
                "ORD-" + orderEvent.getOrderId(), 
                orderEvent.getTotalAmount()
            );
        }
    }

    @KafkaListener(topics = "payment-topic", groupId = "notification-group")
    public void consumePaymentEvent(PaymentEvent paymentEvent) {
        log.info("Received PaymentEvent in Notification Service: {}", paymentEvent);
        if (paymentEvent.getOrderId() == null) return;

        String recipientEmail = "user_" + paymentEvent.getOrderId() + "@example.com";
        
        if ("PAID".equalsIgnoreCase(paymentEvent.getStatus())) {
            notificationService.sendOrderConfirmation(
                recipientEmail, 
                paymentEvent.getOrderId(), 
                paymentEvent.getTransactionId(), 
                paymentEvent.getAmount()
            );
        } else if ("FAILED".equalsIgnoreCase(paymentEvent.getStatus())) {
            notificationService.sendPaymentFailureWarning(
                recipientEmail, 
                paymentEvent.getOrderId(), 
                paymentEvent.getMessage() != null ? paymentEvent.getMessage() : "Transaction declined"
            );
        }
    }
}

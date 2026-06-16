package com.substring.easybuy.cart_order.consumer;

import com.substring.easybuy.common.events.PaymentEvent;
import com.substring.easybuy.cart_order.service.OrderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PaymentEventConsumer {

    private final OrderService orderService;

    public PaymentEventConsumer(OrderService orderService) {
        this.orderService = orderService;
    }

    @KafkaListener(topics = "payment-topic", groupId = "order-group")
    public void consumePaymentEvent(PaymentEvent paymentEvent) {
        log.info("Received PaymentEvent from Kafka: {}", paymentEvent);

        if (paymentEvent.getOrderId() == null) {
            log.error("Received PaymentEvent with null orderId");
            return;
        }

        try {
            log.info("Updating order payment status from Kafka for Order ID: {} with status: {}", 
                    paymentEvent.getOrderId(), paymentEvent.getStatus());
            orderService.updatePaymentStatus(paymentEvent.getOrderId(), paymentEvent.getStatus());
        } catch (Exception e) {
            log.error("Failed to update payment status for Order ID: {} from Kafka PaymentEvent", 
                    paymentEvent.getOrderId(), e);
        }
    }
}

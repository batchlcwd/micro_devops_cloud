package com.substring.easybuy.payments.producer;

import com.substring.easybuy.common.events.PaymentEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PaymentEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String PAYMENT_TOPIC = "payment-topic";

    public PaymentEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishPaymentEvent(PaymentEvent paymentEvent) {
        try {
            log.info("Publishing PaymentEvent to Kafka: {}", paymentEvent);
            this.kafkaTemplate.send(PAYMENT_TOPIC, paymentEvent);
            log.info("PaymentEvent published successfully for Order ID: {}", paymentEvent.getOrderId());
        } catch (Exception e) {
            log.error("Failed to publish PaymentEvent for Order ID: {}", paymentEvent.getOrderId(), e);
        }
    }
}

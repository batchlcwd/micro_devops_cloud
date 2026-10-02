package com.substring.easybuy.notifications.consumer;

import com.substring.easybuy.common.events.OrderEvent;
import com.substring.easybuy.notifications.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEventConsumerTest {

    @Mock
    private NotificationService notificationService;

    private NotificationEventConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new NotificationEventConsumer(notificationService);
    }

    @Test
    void consumeOrderEvent_sendsEmail_whenEmailIsPresentInOrderEvent() {
        OrderEvent orderEvent = new OrderEvent();
        orderEvent.setOrderId(101L);
        orderEvent.setUserId("user-123");
        orderEvent.setEmail("customer@example.com");
        orderEvent.setStatus("CONFIRMED");
        orderEvent.setTotalAmount(new BigDecimal("299.99"));

        consumer.consumeOrderEvent(orderEvent);

        verify(notificationService, times(1)).sendOrderConfirmation(
                eq("customer@example.com"),
                eq(101L),
                eq("ORD-101"),
                eq(new BigDecimal("299.99"))
        );
    }

    @Test
    void consumeOrderEvent_fallsBackToUserId_whenEmailIsNull() {
        OrderEvent orderEvent = new OrderEvent();
        orderEvent.setOrderId(102L);
        orderEvent.setUserId("user@example.com");
        orderEvent.setEmail(null);
        orderEvent.setStatus("CONFIRMED");
        orderEvent.setTotalAmount(new BigDecimal("150.00"));

        consumer.consumeOrderEvent(orderEvent);

        verify(notificationService, times(1)).sendOrderConfirmation(
                eq("user@example.com"),
                eq(102L),
                eq("ORD-102"),
                eq(new BigDecimal("150.00"))
        );
    }
}

package com.substring.easybuy.inventory.consumer;

import com.substring.easybuy.common.events.PaymentEvent;
import com.substring.easybuy.inventory.external.OrderClient;
import com.substring.easybuy.inventory.external.OrderResponse;
import com.substring.easybuy.inventory.dto.ReleaseStockRequest;
import com.substring.easybuy.inventory.service.InventoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PaymentEventConsumer {

    private final OrderClient orderClient;
    private final InventoryService inventoryService;

    public PaymentEventConsumer(OrderClient orderClient, InventoryService inventoryService) {
        this.orderClient = orderClient;
        this.inventoryService = inventoryService;
    }

    @KafkaListener(topics = "payment-topic", groupId = "inventory-group")
    public void consumePaymentEvent(PaymentEvent paymentEvent) {
        log.info("Received PaymentEvent in inventory-service from Kafka: {}", paymentEvent);

        if (paymentEvent.getOrderId() == null) {
            log.error("Received PaymentEvent with null orderId in inventory-service");
            return;
        }

        if ("FAILED".equalsIgnoreCase(paymentEvent.getStatus())) {
            log.warn("Payment failed for Order ID: {}. Releasing inventory stock...", paymentEvent.getOrderId());
            try {
                // Fetch order details to know the items and quantities to release
                OrderResponse orderResponse = orderClient.getOrderById(paymentEvent.getOrderId());
                if (orderResponse == null || orderResponse.items() == null) {
                    log.error("Failed to fetch order details or items for Order ID: {} during compensation", paymentEvent.getOrderId());
                    return;
                }

                // Release stock for each item in the order
                orderResponse.items().forEach(item -> {
                    try {
                        log.info("Releasing stock for Product ID: {}, Quantity: {}", item.productId(), item.quantity());
                        inventoryService.releaseStockByProductId(item.productId(), new ReleaseStockRequest(item.quantity()));
                    } catch (Exception ex) {
                        log.error("Failed to release stock for Product ID: {} during payment failed compensation", item.productId(), ex);
                    }
                });
                log.info("Inventory successfully released for Order ID: {} after payment failure", paymentEvent.getOrderId());
            } catch (Exception e) {
                log.error("Error retrieving order details or releasing inventory for Order ID: {}", paymentEvent.getOrderId(), e);
            }
        }
    }
}

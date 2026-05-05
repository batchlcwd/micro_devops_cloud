package com.substring.easybuy.cart_order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.substring.easybuy.cart_order.entity.OrderStatus;

public record OrderResponse(
		Long id,
		String orderNumber,
		String userId,
		String shippingAddress,
		String paymentMethod,
		OrderStatus status,
		BigDecimal totalAmount,
		List<OrderItemResponse> items,
		Instant createdAt,
		Instant updatedAt,
		Instant cancelledAt) {
}

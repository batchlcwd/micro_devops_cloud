package com.substring.easybuy.inventory.external;

import java.util.List;

public record OrderResponse(
		Long id,
		String billingName,
		String billingPhone,
		String orderNumber,
		String userId,
		String shippingAddress,
		String paymentStatus,
		String extraInformation,
		String paymentMethod,
		String status,
		java.math.BigDecimal totalAmount,
		List<OrderItemResponse> items) {
}

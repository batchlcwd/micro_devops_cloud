package com.substring.easybuy.cart_order.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
		Long id,
		UUID productId,
		String productTitle,
		BigDecimal unitPrice,
		Integer discountPercent,
		Integer quantity,
		BigDecimal lineTotal) {
}

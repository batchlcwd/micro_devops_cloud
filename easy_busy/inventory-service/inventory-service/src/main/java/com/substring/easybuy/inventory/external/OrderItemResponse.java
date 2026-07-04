package com.substring.easybuy.inventory.external;

import java.util.UUID;

public record OrderItemResponse(
		Long id,
		UUID productId,
		String productTitle,
		java.math.BigDecimal unitPrice,
		Integer discountPercent,
		Integer quantity,
		java.math.BigDecimal lineTotal) {
}

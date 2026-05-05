package com.substring.easybuy.cart_order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.substring.easybuy.cart_order.entity.CartStatus;

public record CartResponse(
		Long id,
		String userId,
		CartStatus status,
		BigDecimal totalAmount,
		List<CartItemResponse> items,
		Instant createdAt,
		Instant updatedAt,
		Instant checkedOutAt) {
}

package com.substring.easybuy.cart_order.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ReleaseStockRequest(
		@NotNull @Positive Integer quantity) {
}

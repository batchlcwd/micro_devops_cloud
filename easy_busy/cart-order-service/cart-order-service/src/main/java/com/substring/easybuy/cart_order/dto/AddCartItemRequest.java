package com.substring.easybuy.cart_order.dto;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddCartItemRequest(
		@NotNull UUID productId,
		@NotNull @Min(1) Integer quantity) {
}

package com.substring.easybuy.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ReleaseStockRequest(
		@NotNull @Positive Integer quantity) {
}

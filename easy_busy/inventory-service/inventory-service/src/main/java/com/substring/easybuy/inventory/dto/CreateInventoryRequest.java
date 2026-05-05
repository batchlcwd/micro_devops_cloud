package com.substring.easybuy.inventory.dto;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateInventoryRequest(
		@NotNull UUID productId,
		@NotBlank String sku,
		@NotBlank String productName,
		@NotBlank String warehouseLocation,
		@NotNull @Min(0) Integer availableQuantity,
		@Min(0) Integer reservedQuantity,
		@Min(0) Integer reorderLevel,
		Boolean active) {
}

package com.substring.easybuy.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateInventoryRequest(
		@NotBlank String productName,
		@NotBlank String warehouseLocation,
		@NotNull @Min(0) Integer reorderLevel,
		@NotNull Boolean active) {
}

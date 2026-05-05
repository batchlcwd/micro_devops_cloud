package com.substring.easybuy.inventory.dto;

import java.time.Instant;
import java.util.UUID;

public record InventoryResponse(
		Long id,
		UUID productId,
		String sku,
		String productName,
		String warehouseLocation,
		Integer availableQuantity,
		Integer reservedQuantity,
		Integer reorderLevel,
		Boolean active,
		Integer totalQuantity,
		Boolean lowStock,
		Instant createdAt,
		Instant updatedAt) {
}

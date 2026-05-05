package com.substring.easybuy.cart_order.dto;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record InventorySnapshot(
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

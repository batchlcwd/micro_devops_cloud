package com.substring.easybuy.inventory.dto;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BatchReleaseItemRequest(
        Long inventoryId,
        UUID productId,
        @NotNull @Positive Integer quantity) {
}

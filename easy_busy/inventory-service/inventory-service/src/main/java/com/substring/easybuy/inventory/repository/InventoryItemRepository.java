package com.substring.easybuy.inventory.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.substring.easybuy.inventory.domain.InventoryItem;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

	Optional<InventoryItem> findBySku(String sku);

	Optional<InventoryItem> findByProductId(UUID productId);

	boolean existsBySku(String sku);

	boolean existsByProductId(UUID productId);

	List<InventoryItem> findByActiveTrueOrderByProductNameAsc();

	List<InventoryItem> findByAvailableQuantityLessThanEqualAndActiveTrueOrderByAvailableQuantityAsc(int threshold);
}

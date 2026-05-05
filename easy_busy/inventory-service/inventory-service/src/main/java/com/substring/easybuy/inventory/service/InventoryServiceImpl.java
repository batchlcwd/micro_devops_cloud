package com.substring.easybuy.inventory.service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.substring.easybuy.inventory.domain.InventoryItem;
import com.substring.easybuy.inventory.dto.AdjustStockRequest;
import com.substring.easybuy.inventory.dto.CreateInventoryRequest;
import com.substring.easybuy.inventory.dto.InventoryResponse;
import com.substring.easybuy.inventory.dto.ReleaseStockRequest;
import com.substring.easybuy.inventory.dto.ReserveStockRequest;
import com.substring.easybuy.inventory.dto.UpdateInventoryRequest;
import com.substring.easybuy.inventory.exception.BusinessRuleException;
import com.substring.easybuy.inventory.exception.ResourceNotFoundException;
import com.substring.easybuy.inventory.repository.InventoryItemRepository;

@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

	private final InventoryItemRepository repository;

	public InventoryServiceImpl(InventoryItemRepository repository) {
		this.repository = repository;
	}

	@Override
	public InventoryResponse create(CreateInventoryRequest request) {
		String sku = normalizeSku(request.sku());
		if (repository.existsBySku(sku)) {
			throw new BusinessRuleException("Inventory already exists for sku: " + sku);
		}
		if (repository.existsByProductId(request.productId())) {
			throw new BusinessRuleException("Inventory already exists for productId: " + request.productId());
		}

		InventoryItem item = new InventoryItem();
		item.setProductId(request.productId());
		item.setSku(sku);
		item.setProductName(trim(request.productName()));
		item.setWarehouseLocation(trim(request.warehouseLocation()));
		item.setAvailableQuantity(defaultZero(request.availableQuantity()));
		item.setReservedQuantity(defaultZero(request.reservedQuantity()));
		item.setReorderLevel(defaultZero(request.reorderLevel()));
		item.setActive(request.active() == null || request.active());

		return toResponse(repository.save(item));
	}

	@Override
	public InventoryResponse update(Long id, UpdateInventoryRequest request) {
		InventoryItem item = findEntity(id);
		item.setProductName(trim(request.productName()));
		item.setWarehouseLocation(trim(request.warehouseLocation()));
		item.setReorderLevel(request.reorderLevel());
		item.setActive(request.active());
		return toResponse(repository.save(item));
	}

	@Override
	@Transactional(readOnly = true)
	public InventoryResponse getById(Long id) {
		return toResponse(findEntity(id));
	}

	@Override
	@Transactional(readOnly = true)
	public InventoryResponse getBySku(String sku) {
		return toResponse(repository.findBySku(normalizeSku(sku))
				.orElseThrow(() -> new ResourceNotFoundException("Inventory not found for sku: " + sku)));
	}

	@Override
	@Transactional(readOnly = true)
	public InventoryResponse getByProductId(UUID productId) {
		return toResponse(repository.findByProductId(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Inventory not found for productId: " + productId)));
	}

	@Override
	@Transactional(readOnly = true)
	public List<InventoryResponse> getAll() {
		return repository.findAll()
				.stream()
				.map(this::toResponse)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<InventoryResponse> getLowStock(int threshold) {
		return repository.findByAvailableQuantityLessThanEqualAndActiveTrueOrderByAvailableQuantityAsc(threshold)
				.stream()
				.map(this::toResponse)
				.toList();
	}

	@Override
	public InventoryResponse adjustStock(Long id, AdjustStockRequest request) {
		InventoryItem item = findEntity(id);
		int delta = request.quantityDelta();
		int nextAvailable = safeInt(item.getAvailableQuantity()) + delta;
		if (nextAvailable < 0) {
			throw new BusinessRuleException("Adjustment would make available quantity negative");
		}
		item.setAvailableQuantity(nextAvailable);
		return toResponse(repository.save(item));
	}

	@Override
	public InventoryResponse reserveStock(Long id, ReserveStockRequest request) {
		InventoryItem item = findEntity(id);
		int quantity = request.quantity();
		int available = safeInt(item.getAvailableQuantity());
		if (available < quantity) {
			throw new BusinessRuleException("Insufficient available stock to reserve");
		}
		item.setAvailableQuantity(available - quantity);
		item.setReservedQuantity(safeInt(item.getReservedQuantity()) + quantity);
		return toResponse(repository.save(item));
	}

	@Override
	public InventoryResponse releaseStock(Long id, ReleaseStockRequest request) {
		InventoryItem item = findEntity(id);
		int quantity = request.quantity();
		int reserved = safeInt(item.getReservedQuantity());
		if (reserved < quantity) {
			throw new BusinessRuleException("Insufficient reserved stock to release");
		}
		item.setReservedQuantity(reserved - quantity);
		item.setAvailableQuantity(safeInt(item.getAvailableQuantity()) + quantity);
		return toResponse(repository.save(item));
	}

	@Override
	public InventoryResponse reserveStockByProductId(UUID productId, ReserveStockRequest request) {
		InventoryItem item = repository.findByProductId(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Inventory not found for productId: " + productId));
		return reserve(item, request.quantity());
	}

	@Override
	public InventoryResponse releaseStockByProductId(UUID productId, ReleaseStockRequest request) {
		InventoryItem item = repository.findByProductId(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Inventory not found for productId: " + productId));
		return release(item, request.quantity());
	}

	@Override
	public void delete(Long id) {
		InventoryItem item = findEntity(id);
		repository.delete(item);
	}

	private InventoryItem findEntity(Long id) {
		return repository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Inventory not found for id: " + id));
	}

	private InventoryResponse reserve(InventoryItem item, int quantity) {
		int available = safeInt(item.getAvailableQuantity());
		if (available < quantity) {
			throw new BusinessRuleException("Insufficient available stock to reserve");
		}
		item.setAvailableQuantity(available - quantity);
		item.setReservedQuantity(safeInt(item.getReservedQuantity()) + quantity);
		return toResponse(repository.save(item));
	}

	private InventoryResponse release(InventoryItem item, int quantity) {
		int reserved = safeInt(item.getReservedQuantity());
		if (reserved < quantity) {
			throw new BusinessRuleException("Insufficient reserved stock to release");
		}
		item.setReservedQuantity(reserved - quantity);
		item.setAvailableQuantity(safeInt(item.getAvailableQuantity()) + quantity);
		return toResponse(repository.save(item));
	}

	private InventoryResponse toResponse(InventoryItem item) {
		return new InventoryResponse(
				item.getId(),
				item.getProductId(),
				item.getSku(),
				item.getProductName(),
				item.getWarehouseLocation(),
				item.getAvailableQuantity(),
				item.getReservedQuantity(),
				item.getReorderLevel(),
				item.isActive(),
				item.getTotalQuantity(),
				item.isLowStock(),
				item.getCreatedAt(),
				item.getUpdatedAt());
	}

	private String normalizeSku(String sku) {
		if (!StringUtils.hasText(sku)) {
			throw new BusinessRuleException("SKU is required");
		}
		return sku.trim().toUpperCase(Locale.ROOT);
	}

	private String trim(String value) {
		return value == null ? null : value.trim();
	}

	private int defaultZero(Integer value) {
		return value == null ? 0 : value;
	}

	private int safeInt(Integer value) {
		return value == null ? 0 : value;
	}
}

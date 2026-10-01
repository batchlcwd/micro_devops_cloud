package com.substring.easybuy.inventory.service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.substring.easybuy.common.payload.ProductSnapshot;
import com.substring.easybuy.inventory.external.ProductClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.substring.easybuy.inventory.domain.InventoryItem;
import lombok.extern.slf4j.Slf4j;
import com.substring.easybuy.inventory.dto.AdjustStockRequest;
import com.substring.easybuy.inventory.dto.BatchReleaseItemRequest;
import com.substring.easybuy.inventory.dto.BatchReserveItemRequest;
import com.substring.easybuy.inventory.dto.CreateInventoryRequest;
import com.substring.easybuy.inventory.dto.InventoryResponse;
import com.substring.easybuy.inventory.dto.ReleaseStockRequest;
import com.substring.easybuy.inventory.dto.ReserveStockRequest;
import com.substring.easybuy.inventory.dto.UpdateInventoryRequest;
import com.substring.easybuy.inventory.exception.BusinessRuleException;
import com.substring.easybuy.inventory.exception.ResourceNotFoundException;
import com.substring.easybuy.inventory.repository.InventoryItemRepository;

@Slf4j
@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final InventoryItemRepository repository;
    private final ProductClient productClient;

    public InventoryServiceImpl(InventoryItemRepository repository, ProductClient productClient) {
        this.repository = repository;
        this.productClient = productClient;
    }

    @Override
    public InventoryResponse create(CreateInventoryRequest request) {

        //check if product exists or not:
        ProductSnapshot productSnapshot = null;
        try {
            productSnapshot = this.productClient.getProductById(request.productId());
        } catch (Exception e) {
            throw new ResourceNotFoundException("Product not found");
        }


        //business rules
        String sku = normalizeSku(request.sku());
        //check that sku is already exists or not
        if (repository.existsBySku(sku)) {
            throw new BusinessRuleException("Inventory already exists for sku: " + sku);
        }

        //check that inventory is exists by product or not
        if (repository.existsByProductId(request.productId())) {
            throw new BusinessRuleException("Inventory already exists for productId: " + request.productId());
        }

        InventoryItem item = new InventoryItem();
        item.setProductId(request.productId());
        item.setSku(sku);
        item.setProductName(trim(productSnapshot.title()));
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
        //if you want to update any other property
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
    //Assignment:
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
        InventoryItem item = findEntityForUpdate(id);
        int delta = request.quantityDelta();
        int nextAvailable = safeInt(item.getAvailableQuantity()) + delta;
        if (nextAvailable < 0) {
            throw new BusinessRuleException("Adjustment would make available quantity negative");
        }
        item.setAvailableQuantity(nextAvailable);
        item.setReasonToAdjustQuantity(trim(request.reason()));
        return toResponse(repository.save(item));
    }

    @Override
    public InventoryResponse reserveStock(Long id, ReserveStockRequest request) {
        InventoryItem item = findEntityForUpdate(id);
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
        InventoryItem item = findEntityForUpdate(id);
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
        InventoryItem item = repository.findByProductIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for productId: " + productId));
        return reserve(item, request.quantity());
    }

    @Override
    public InventoryResponse releaseStockByProductId(UUID productId, ReleaseStockRequest request) {
        InventoryItem item = repository.findByProductIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for productId: " + productId));
        return release(item, request.quantity());
    }

    @Override
    public List<InventoryResponse> batchReserveStock(List<BatchReserveItemRequest> requests) {
        log.info("Batch reserving stock for {} items", requests.size());
        return requests.stream()
                .map(req -> {
                    if (req.productId() != null) {
                        return reserveStockByProductId(req.productId(), new ReserveStockRequest(req.quantity()));
                    } else if (req.inventoryId() != null) {
                        return reserveStock(req.inventoryId(), new ReserveStockRequest(req.quantity()));
                    } else {
                        throw new BusinessRuleException("Either productId or inventoryId must be provided for batch reserve");
                    }
                })
                .toList();
    }

    @Override
    public List<InventoryResponse> batchReleaseStock(List<BatchReleaseItemRequest> requests) {
        log.info("Batch releasing stock for {} items", requests.size());
        return requests.stream()
                .map(req -> {
                    if (req.productId() != null) {
                        return releaseStockByProductId(req.productId(), new ReleaseStockRequest(req.quantity()));
                    } else if (req.inventoryId() != null) {
                        return releaseStock(req.inventoryId(), new ReleaseStockRequest(req.quantity()));
                    } else {
                        throw new BusinessRuleException("Either productId or inventoryId must be provided for batch release");
                    }
                })
                .toList();
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

    private InventoryItem findEntityForUpdate(Long id) {
        return repository.findByIdForUpdate(id)
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


    //checks for sku contains text:
    private String normalizeSku(String sku) {
        //sku normaize rules
        if (!StringUtils.hasText(sku)) {
            throw new BusinessRuleException("SKU is required");
        }
//		IPHONE-14-BLACK
        return sku.trim().toUpperCase();
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

package com.substring.easybuy.inventory.service;

import java.util.List;
import java.util.UUID;

import com.substring.easybuy.inventory.dto.AdjustStockRequest;
import com.substring.easybuy.inventory.dto.CreateInventoryRequest;
import com.substring.easybuy.inventory.dto.InventoryResponse;
import com.substring.easybuy.inventory.dto.ReleaseStockRequest;
import com.substring.easybuy.inventory.dto.ReserveStockRequest;
import com.substring.easybuy.inventory.dto.UpdateInventoryRequest;


//inventory item mein opreations :
//logics:
public interface InventoryService {

	//create the inventory
	InventoryResponse create(CreateInventoryRequest request);

	//update inventory
	InventoryResponse update(Long id, UpdateInventoryRequest request);

	InventoryResponse getById(Long id);

	InventoryResponse getBySku(String sku);

	InventoryResponse getByProductId(UUID productId);

	List<InventoryResponse> getAll();

	List<InventoryResponse> getLowStock(int threshold);

	InventoryResponse adjustStock(Long id, AdjustStockRequest request);

	InventoryResponse reserveStock(Long id, ReserveStockRequest request);

	InventoryResponse releaseStock(Long id, ReleaseStockRequest request);

	InventoryResponse reserveStockByProductId(UUID productId, ReserveStockRequest request);

	InventoryResponse releaseStockByProductId(UUID productId, ReleaseStockRequest request);

	List<InventoryResponse> batchReserveStock(List<com.substring.easybuy.inventory.dto.BatchReserveItemRequest> requests);

	List<InventoryResponse> batchReleaseStock(List<com.substring.easybuy.inventory.dto.BatchReleaseItemRequest> requests);

	void delete(Long id);
}

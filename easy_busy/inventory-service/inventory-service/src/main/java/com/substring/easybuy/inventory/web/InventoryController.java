package com.substring.easybuy.inventory.web;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.substring.easybuy.inventory.dto.AdjustStockRequest;
import com.substring.easybuy.inventory.dto.CreateInventoryRequest;
import com.substring.easybuy.inventory.dto.InventoryResponse;
import com.substring.easybuy.inventory.dto.ReleaseStockRequest;
import com.substring.easybuy.inventory.dto.ReserveStockRequest;
import com.substring.easybuy.inventory.dto.UpdateInventoryRequest;
import com.substring.easybuy.inventory.service.InventoryService;

@RestController
@Validated
@RequestMapping("/api/inventories")
public class InventoryController {

	private final InventoryService service;

	public InventoryController(InventoryService service) {
		this.service = service;
	}

	@PostMapping
	public ResponseEntity<InventoryResponse> create(@Valid @RequestBody CreateInventoryRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
	}

	@GetMapping
	public List<InventoryResponse> getAll() {
		return service.getAll();
	}

	@GetMapping("/{id}")
	public InventoryResponse getById(@PathVariable Long id) {
		return service.getById(id);
	}

	@GetMapping("/sku/{sku}")
	public InventoryResponse getBySku(@PathVariable String sku) {
		return service.getBySku(sku);
	}

	@GetMapping("/product/{productId}")
	public InventoryResponse getByProductId(@PathVariable UUID productId) {
		return service.getByProductId(productId);
	}

	@GetMapping("/low-stock")
	public List<InventoryResponse> getLowStock(@RequestParam(defaultValue = "10") @Min(0) int threshold) {
		return service.getLowStock(threshold);
	}

	@PutMapping("/{id}")
	public InventoryResponse update(@PathVariable Long id, @Valid @RequestBody UpdateInventoryRequest request) {
		return service.update(id, request);
	}

	@PatchMapping("/{id}/adjust-stock")
	public InventoryResponse adjustStock(@PathVariable Long id, @Valid @RequestBody AdjustStockRequest request) {
		return service.adjustStock(id, request);
	}

	@PostMapping("/{id}/reserve")
	public InventoryResponse reserve(@PathVariable Long id, @Valid @RequestBody ReserveStockRequest request) {
		return service.reserveStock(id, request);
	}

	@PostMapping("/{id}/release")
	public InventoryResponse release(@PathVariable Long id, @Valid @RequestBody ReleaseStockRequest request) {
		return service.releaseStock(id, request);
	}

	@PostMapping("/product/{productId}/reserve")
	public InventoryResponse reserveByProductId(@PathVariable UUID productId, @Valid @RequestBody ReserveStockRequest request) {
		return service.reserveStockByProductId(productId, request);
	}

	@PostMapping("/product/{productId}/release")
	public InventoryResponse releaseByProductId(@PathVariable UUID productId, @Valid @RequestBody ReleaseStockRequest request) {
		return service.releaseStockByProductId(productId, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}
}

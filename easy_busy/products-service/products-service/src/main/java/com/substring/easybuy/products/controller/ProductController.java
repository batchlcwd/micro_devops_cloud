package com.substring.easybuy.products.controller;

import com.substring.easybuy.products.dto.ProductDto;
import com.substring.easybuy.products.dto.PagedResponse;
import com.substring.easybuy.products.dto.ReviewDto;
import com.substring.easybuy.products.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@Validated
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<ProductDto>> getAllProducts(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "12") @Min(value = 1, message = "size must be greater than 0") @Max(value = 100, message = "size must be at most 100") int size
    ) {
        return ResponseEntity.ok(productService.getAllProducts(page, size));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable UUID productId) {
        return ResponseEntity.ok(productService.getProductById(productId));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<PagedResponse<ProductDto>> getProductsByCategoryId(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "12") @Min(value = 1, message = "size must be greater than 0") @Max(value = 100, message = "size must be at most 100") int size
    ) {
        return ResponseEntity.ok(productService.getProductsByCategoryId(categoryId, page, size));
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductDto productDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(productDto));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable UUID productId, @Valid @RequestBody ProductDto productDto) {
        return ResponseEntity.ok(productService.updateProduct(productId, productDto));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{productId}/categories/{categoryId}")
    public ResponseEntity<ProductDto> addCategoryToProduct(@PathVariable UUID productId, @PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.addCategoryToProduct(productId, categoryId));
    }

    @DeleteMapping("/{productId}/categories/{categoryId}")
    public ResponseEntity<ProductDto> removeCategoryFromProduct(@PathVariable UUID productId, @PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.removeCategoryFromProduct(productId, categoryId));
    }

    @PostMapping("/{productId}/reviews")
    public ResponseEntity<ReviewDto> addReviewToProduct(@PathVariable UUID productId, @Valid @RequestBody ReviewDto reviewDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.addReviewToProduct(productId, reviewDto));
    }

    @PostMapping(value = "/{productId}/images", consumes = "multipart/form-data")
    public ResponseEntity<ProductDto> addProductImages(
            @PathVariable UUID productId,
            @RequestParam("files") java.util.List<MultipartFile> files
    ) {
        return ResponseEntity.ok(productService.addProductImages(productId, files));
    }

    @GetMapping("/{productId}/images")
    public ResponseEntity<java.util.List<String>> getProductImages(@PathVariable UUID productId) {
        return ResponseEntity.ok(productService.getProductImages(productId));
    }
}

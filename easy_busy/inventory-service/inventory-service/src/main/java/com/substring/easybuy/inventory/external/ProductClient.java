package com.substring.easybuy.inventory.external;

import com.substring.easybuy.common.payload.ProductSnapshot;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "${PRODUCT_SERVICE_NAME:PRODUCT-SERVICE}", url = "${PRODUCT_SERVICE_URL:http://localhost:8081}")
public interface ProductClient {

    @GetMapping("/api/products/{productId}")
    ProductSnapshot getProductById(@PathVariable UUID productId);


}

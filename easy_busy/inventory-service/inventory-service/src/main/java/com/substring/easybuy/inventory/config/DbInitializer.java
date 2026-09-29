package com.substring.easybuy.inventory.config;

import com.substring.easybuy.inventory.domain.InventoryItem;
import com.substring.easybuy.inventory.repository.InventoryItemRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.UUID;

@Component
public class DbInitializer implements CommandLineRunner {

    private final InventoryItemRepository inventoryItemRepository;

    public DbInitializer(InventoryItemRepository inventoryItemRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (inventoryItemRepository.count() == 0) {
            // Match the specific UUIDs defined in the products database seeder
            UUID iphoneId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
            UUID headphonesId = UUID.fromString("550e8400-e29b-41d4-a716-446655440001");
            UUID sneakersId = UUID.fromString("550e8400-e29b-41d4-a716-446655440002");

            InventoryItem iphoneInventory = new InventoryItem();
            iphoneInventory.setProductId(iphoneId);
            iphoneInventory.setSku("SKU-IPHONE15PRO");
            iphoneInventory.setProductName("iPhone 15 Pro");
            iphoneInventory.setWarehouseLocation("WH-A1");
            iphoneInventory.setAvailableQuantity(50);
            iphoneInventory.setReservedQuantity(0);
            iphoneInventory.setReorderLevel(5);
            iphoneInventory.setActive(true);

            InventoryItem headphonesInventory = new InventoryItem();
            headphonesInventory.setProductId(headphonesId);
            headphonesInventory.setSku("SKU-SONYXM5");
            headphonesInventory.setProductName("Sony WH-1000XM5");
            headphonesInventory.setWarehouseLocation("WH-B3");
            headphonesInventory.setAvailableQuantity(100);
            headphonesInventory.setReservedQuantity(0);
            headphonesInventory.setReorderLevel(10);
            headphonesInventory.setActive(true);

            InventoryItem sneakersInventory = new InventoryItem();
            sneakersInventory.setProductId(sneakersId);
            sneakersInventory.setSku("SKU-NIKEAIRMAX");
            sneakersInventory.setProductName("Nike Air Max");
            sneakersInventory.setWarehouseLocation("WH-C2");
            sneakersInventory.setAvailableQuantity(200);
            sneakersInventory.setReservedQuantity(0);
            sneakersInventory.setReorderLevel(15);
            sneakersInventory.setActive(true);

            inventoryItemRepository.saveAll(Arrays.asList(iphoneInventory, headphonesInventory, sneakersInventory));

            System.out.println("Seeded database with default inventories matching default products.");
        }
    }
}

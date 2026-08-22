package com.substring.easybuy.products.config;

import com.substring.easybuy.products.entity.Category;
import com.substring.easybuy.products.entity.Product;
import com.substring.easybuy.products.repository.CategoryRepo;
import com.substring.easybuy.products.repository.ProductRepo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
public class DbInitializer implements CommandLineRunner {

    private final ProductRepo productRepo;
    private final CategoryRepo categoryRepo;

    public DbInitializer(ProductRepo productRepo, CategoryRepo categoryRepo) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
    }

    @Override
    public void run(String... args) throws Exception {
        if (productRepo.count() == 0) {
            // Define specific UUIDs to match inventory database seeding

            Product iphone = new Product();

            iphone.setTitle("iPhone 15 Pro");
            iphone.setShortDesc("Titanium design, A17 Pro chip, Action button.");
            iphone.setLongDesc("The iPhone 15 Pro features a strong and light aerospace-grade titanium design. Powered by the A17 Pro chip, it brings next-level graphics performance to gaming.");
            iphone.setPrice(999.99);
            iphone.setDiscount(5);
            iphone.setLive(true);
            iphone.setProductImages(Arrays.asList("https://example.com/images/iphone15pro.jpg"));

            Product headphones = new Product();

            headphones.setTitle("Sony WH-1000XM5");
            headphones.setShortDesc("Industry leading noise canceling headphones.");
            headphones.setLongDesc("Sony WH-1000XM5 headphones rewrite the rules for distraction-free listening. Two processors control 8 microphones for unprecedented noise cancellation.");
            headphones.setPrice(399.99);
            headphones.setDiscount(10);
            headphones.setLive(true);
            headphones.setProductImages(Arrays.asList("https://example.com/images/sonyXM5.jpg"));

            Product sneakers = new Product();

            sneakers.setTitle("Nike Air Max");
            sneakers.setShortDesc("Classic style with maximum comfort.");
            sneakers.setLongDesc("The Nike Air Max offers lightweight cushioning and classic style. Made from premium materials for long-lasting durability.");
            sneakers.setPrice(129.99);
            sneakers.setDiscount(0);
            sneakers.setLive(true);
            sneakers.setProductImages(Arrays.asList("https://example.com/images/nikeairmax.jpg"));

            // Save products first and retrieve managed instances
            List<Product> saved = productRepo.saveAll(Arrays.asList(iphone, headphones, sneakers));
            Product managedIphone = saved.get(0);
            Product managedHeadphones = saved.get(1);
            Product managedSneakers = saved.get(2);

            // Create Categories
            Category electronics = new Category();
            electronics.setTitle("Electronics");
            electronics.setProducts(new ArrayList<>(Arrays.asList(managedIphone, managedHeadphones)));

            Category clothing = new Category();
            clothing.setTitle("Clothing");
            clothing.setProducts(new ArrayList<>(Arrays.asList(managedSneakers)));

            Category books = new Category();
            books.setTitle("Books");
            books.setProducts(new ArrayList<>());

            categoryRepo.saveAll(Arrays.asList(electronics, clothing, books));

            System.out.println("Seeded database with default products and categories.");
        }
    }
}

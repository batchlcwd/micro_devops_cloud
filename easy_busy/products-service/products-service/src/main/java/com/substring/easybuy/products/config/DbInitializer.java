package com.substring.easybuy.products.config;

import com.substring.easybuy.products.entity.Category;
import com.substring.easybuy.products.entity.Product;
import com.substring.easybuy.products.repository.CategoryRepo;
import com.substring.easybuy.products.repository.ProductRepo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
public class DbInitializer implements CommandLineRunner {

    private final ProductRepo productRepo;
    private final CategoryRepo categoryRepo;
    private final JdbcTemplate jdbcTemplate;

    public DbInitializer(ProductRepo productRepo, CategoryRepo categoryRepo, JdbcTemplate jdbcTemplate) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (productRepo.count() == 0) {
            // Define specific UUIDs to match inventory database seeding
            UUID iphoneId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
            UUID headphonesId = UUID.fromString("550e8400-e29b-41d4-a716-446655440001");
            UUID sneakersId = UUID.fromString("550e8400-e29b-41d4-a716-446655440002");

            Timestamp now = Timestamp.from(Instant.now());

            String sql = "INSERT INTO products (id, title, short_desc, long_desc, price, discount, live, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

            jdbcTemplate.update(sql, iphoneId, "iPhone 15 Pro",
                    "Titanium design, A17 Pro chip, Action button.",
                    "The iPhone 15 Pro features a strong and light aerospace-grade titanium design. Powered by the A17 Pro chip, it brings next-level graphics performance to gaming.",
                    999.99, 5, true, now, now);

            jdbcTemplate.update(sql, headphonesId, "Sony WH-1000XM5",
                    "Industry leading noise canceling headphones.",
                    "Sony WH-1000XM5 headphones rewrite the rules for distraction-free listening. Two processors control 8 microphones for unprecedented noise cancellation.",
                    399.99, 10, true, now, now);

            jdbcTemplate.update(sql, sneakersId, "Nike Air Max",
                    "Classic style with maximum comfort.",
                    "The Nike Air Max offers lightweight cushioning and classic style. Made from premium materials for long-lasting durability.",
                    129.99, 0, true, now, now);

            // Fetch managed products from database
            Product managedIphone = productRepo.findById(iphoneId).orElseThrow();
            Product managedHeadphones = productRepo.findById(headphonesId).orElseThrow();
            Product managedSneakers = productRepo.findById(sneakersId).orElseThrow();

            managedIphone.setProductImages(new ArrayList<>(Arrays.asList("https://example.com/images/iphone15pro.jpg")));
            managedHeadphones.setProductImages(new ArrayList<>(Arrays.asList("https://example.com/images/sonyXM5.jpg")));
            managedSneakers.setProductImages(new ArrayList<>(Arrays.asList("https://example.com/images/nikeairmax.jpg")));

            List<Product> saved = productRepo.saveAll(Arrays.asList(managedIphone, managedHeadphones, managedSneakers));
            Product p1 = saved.get(0);
            Product p2 = saved.get(1);
            Product p3 = saved.get(2);

            // Create Categories
            Category electronics = new Category();
            electronics.setTitle("Electronics");
            electronics.setProducts(new ArrayList<>(Arrays.asList(p1, p2)));

            Category clothing = new Category();
            clothing.setTitle("Clothing");
            clothing.setProducts(new ArrayList<>(Arrays.asList(p3)));

            Category books = new Category();
            books.setTitle("Books");
            books.setProducts(new ArrayList<>());

            categoryRepo.saveAll(Arrays.asList(electronics, clothing, books));

            System.out.println("Seeded database with default products and categories.");
        }
    }
}

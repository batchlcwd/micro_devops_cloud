package com.substring.easybuy.products.repository;

import com.substring.easybuy.products.entity.Product;
import com.substring.easybuy.products.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReviewRepo extends JpaRepository<Review, Long> {
    List<Review> findByProduct(Product category);

    List<Review> findByProduct_Id(UUID productId);
}

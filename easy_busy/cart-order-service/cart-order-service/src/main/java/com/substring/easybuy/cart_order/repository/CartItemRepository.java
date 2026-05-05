package com.substring.easybuy.cart_order.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.substring.easybuy.cart_order.entity.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

	Optional<CartItem> findByCartIdAndProductId(Long cartId, UUID productId);
}

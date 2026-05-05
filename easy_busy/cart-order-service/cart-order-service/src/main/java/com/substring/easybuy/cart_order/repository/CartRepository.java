package com.substring.easybuy.cart_order.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.substring.easybuy.cart_order.entity.Cart;
import com.substring.easybuy.cart_order.entity.CartStatus;

public interface CartRepository extends JpaRepository<Cart, Long> {

	Optional<Cart> findByUserIdAndStatus(String userId, CartStatus status);
}

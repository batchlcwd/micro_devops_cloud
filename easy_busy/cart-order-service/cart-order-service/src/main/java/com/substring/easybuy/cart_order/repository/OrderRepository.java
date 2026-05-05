package com.substring.easybuy.cart_order.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.substring.easybuy.cart_order.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

	List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

	Optional<Order> findByOrderNumber(String orderNumber);
}

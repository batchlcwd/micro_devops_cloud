package com.substring.easybuy.cart_order.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.substring.easybuy.cart_order.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}

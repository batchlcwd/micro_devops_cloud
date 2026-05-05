package com.substring.easybuy.cart_order.service;

import java.util.List;
import java.util.UUID;

import com.substring.easybuy.cart_order.dto.CheckoutRequest;
import com.substring.easybuy.cart_order.dto.OrderResponse;

public interface OrderService {

	OrderResponse checkout(String userId, CheckoutRequest request);

	OrderResponse getOrderById(Long orderId);

	OrderResponse getOrderByNumber(String orderNumber);

	List<OrderResponse> getOrdersByUserId(String userId);

	OrderResponse cancelOrder(Long orderId);

	void releaseReservedStock(UUID productId, Integer quantity);
}

package com.substring.easybuy.cart_order.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.substring.easybuy.cart_order.client.InventoryClient;
import com.substring.easybuy.cart_order.entity.Cart;
import com.substring.easybuy.cart_order.entity.CartItem;
import com.substring.easybuy.cart_order.entity.CartStatus;
import com.substring.easybuy.cart_order.entity.Order;
import com.substring.easybuy.cart_order.entity.OrderItem;
import com.substring.easybuy.cart_order.entity.OrderStatus;
import com.substring.easybuy.cart_order.dto.CheckoutRequest;
import com.substring.easybuy.cart_order.dto.InventorySnapshot;
import com.substring.easybuy.cart_order.dto.OrderItemResponse;
import com.substring.easybuy.cart_order.dto.OrderResponse;
import com.substring.easybuy.cart_order.dto.ReleaseStockRequest;
import com.substring.easybuy.cart_order.dto.ReserveStockRequest;
import com.substring.easybuy.cart_order.exception.BusinessRuleException;
import com.substring.easybuy.cart_order.exception.ExternalServiceException;
import com.substring.easybuy.cart_order.exception.ResourceNotFoundException;
import com.substring.easybuy.cart_order.repository.CartRepository;
import com.substring.easybuy.cart_order.repository.OrderRepository;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

	private final CartRepository cartRepository;
	private final OrderRepository orderRepository;
	private final InventoryClient inventoryClient;

	public OrderServiceImpl(CartRepository cartRepository, OrderRepository orderRepository, InventoryClient inventoryClient) {
		this.cartRepository = cartRepository;
		this.orderRepository = orderRepository;
		this.inventoryClient = inventoryClient;
	}

	@Override
	public OrderResponse checkout(String userId, CheckoutRequest request) {
		Cart cart = cartRepository.findByUserIdAndStatus(normalizeUserId(userId), CartStatus.ACTIVE)
				.orElseThrow(() -> new ResourceNotFoundException("Active cart not found for userId: " + userId));
		if (cart.getItems().isEmpty()) {
			throw new BusinessRuleException("Cart is empty");
		}

		List<InventorySnapshot> reservedSnapshots = new ArrayList<>();
		try {
			for (CartItem item : cart.getItems()) {
				reservedSnapshots.add(inventoryClient.reserveByProductId(item.getProductId(), new ReserveStockRequest(item.getQuantity())));
			}

			Order order = buildOrderFromCart(cart, request);
			Order saved = orderRepository.save(order);

			cart.setStatus(CartStatus.CHECKED_OUT);
			cart.setCheckedOutAt(Instant.now());
			cart.getItems().clear();
			cartRepository.save(cart);

			return toResponse(saved);
		} catch (RuntimeException ex) {
			for (int i = reservedSnapshots.size() - 1; i >= 0; i--) {
				CartItem item = cart.getItems().get(i);
				try {
					inventoryClient.releaseByProductId(item.getProductId(), new ReleaseStockRequest(item.getQuantity()));
				} catch (Exception releaseEx) {
					throw new ExternalServiceException("Checkout failed and stock rollback also failed for productId: " + item.getProductId(), releaseEx);
				}
			}
			if (ex instanceof ExternalServiceException externalServiceException) {
				throw externalServiceException;
			}
			throw new ExternalServiceException("Checkout failed", ex);
		}
	}

	@Override
	@Transactional(readOnly = true)
	public OrderResponse getOrderById(Long orderId) {
		return toResponse(orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found for id: " + orderId)));
	}

	@Override
	@Transactional(readOnly = true)
	public OrderResponse getOrderByNumber(String orderNumber) {
		return toResponse(orderRepository.findByOrderNumber(orderNumber)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found for orderNumber: " + orderNumber)));
	}

	@Override
	@Transactional(readOnly = true)
	public List<OrderResponse> getOrdersByUserId(String userId) {
		return orderRepository.findByUserIdOrderByCreatedAtDesc(normalizeUserId(userId))
				.stream()
				.map(this::toResponse)
				.toList();
	}

	@Override
	public OrderResponse cancelOrder(Long orderId) {
		Order order = orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found for id: " + orderId));
		if (order.getStatus() == OrderStatus.CANCELLED) {
			return toResponse(order);
		}
		for (OrderItem item : order.getItems()) {
			try {
				inventoryClient.releaseByProductId(item.getProductId(), new ReleaseStockRequest(item.getQuantity()));
			} catch (Exception ex) {
				throw new ExternalServiceException("Failed to release stock for productId: " + item.getProductId(), ex);
			}
		}
		order.setStatus(OrderStatus.CANCELLED);
		order.setCancelledAt(Instant.now());
		return toResponse(orderRepository.save(order));
	}

	@Override
	public void releaseReservedStock(UUID productId, Integer quantity) {
		try {
			inventoryClient.releaseByProductId(productId, new ReleaseStockRequest(quantity));
		} catch (Exception ex) {
			throw new ExternalServiceException("Failed to release stock for productId: " + productId, ex);
		}
	}

	private Order buildOrderFromCart(Cart cart, CheckoutRequest request) {
		Order order = new Order();
		order.setOrderNumber(UUID.randomUUID().toString());
		order.setUserId(cart.getUserId());
		order.setShippingAddress(request.shippingAddress().trim());
		order.setPaymentMethod(request.paymentMethod());
		order.setStatus(OrderStatus.CONFIRMED);
		order.setItems(new ArrayList<>());

		BigDecimal total = BigDecimal.ZERO;
		for (CartItem cartItem : cart.getItems()) {
			OrderItem orderItem = new OrderItem();
			orderItem.setOrder(order);
			orderItem.setProductId(cartItem.getProductId());
			orderItem.setProductTitle(cartItem.getProductTitle());
			orderItem.setUnitPrice(cartItem.getUnitPrice());
			orderItem.setDiscountPercent(cartItem.getDiscountPercent());
			orderItem.setQuantity(cartItem.getQuantity());
			orderItem.setLineTotal(cartItem.getUnitPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())).setScale(2, RoundingMode.HALF_UP));
			order.getItems().add(orderItem);
			total = total.add(orderItem.getLineTotal());
		}
		order.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
		return order;
	}

	private OrderResponse toResponse(Order order) {
		List<OrderItemResponse> items = order.getItems().stream()
				.map(this::toItemResponse)
				.toList();
		return new OrderResponse(
				order.getId(),
				order.getOrderNumber(),
				order.getUserId(),
				order.getShippingAddress(),
				order.getPaymentMethod(),
				order.getStatus(),
				order.getTotalAmount(),
				items,
				order.getCreatedAt(),
				order.getUpdatedAt(),
				order.getCancelledAt());
	}

	private OrderItemResponse toItemResponse(OrderItem item) {
		return new OrderItemResponse(
				item.getId(),
				item.getProductId(),
				item.getProductTitle(),
				item.getUnitPrice(),
				item.getDiscountPercent(),
				item.getQuantity(),
				item.getLineTotal());
	}

	private String normalizeUserId(String userId) {
		if (userId == null || userId.isBlank()) {
			throw new BusinessRuleException("userId is required");
		}
		return userId.trim();
	}
}

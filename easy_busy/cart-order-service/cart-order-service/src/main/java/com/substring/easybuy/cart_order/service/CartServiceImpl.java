package com.substring.easybuy.cart_order.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.substring.easybuy.cart_order.client.ProductClient;
import com.substring.easybuy.cart_order.entity.Cart;
import com.substring.easybuy.cart_order.entity.CartItem;
import com.substring.easybuy.cart_order.entity.CartStatus;
import com.substring.easybuy.cart_order.dto.AddCartItemRequest;
import com.substring.easybuy.cart_order.dto.CartItemResponse;
import com.substring.easybuy.cart_order.dto.CartResponse;
import com.substring.easybuy.cart_order.dto.ProductSnapshot;
import com.substring.easybuy.cart_order.dto.UpdateCartItemRequest;
import com.substring.easybuy.cart_order.exception.BusinessRuleException;
import com.substring.easybuy.cart_order.exception.ExternalServiceException;
import com.substring.easybuy.cart_order.exception.ResourceNotFoundException;
import com.substring.easybuy.cart_order.repository.CartRepository;

@Service
@Transactional
public class CartServiceImpl implements CartService {

	private final CartRepository cartRepository;
	private final ProductClient productClient;

	public CartServiceImpl(CartRepository cartRepository, ProductClient productClient) {
		this.cartRepository = cartRepository;
		this.productClient = productClient;
	}

	@Override
	@Transactional(readOnly = true)
	public CartResponse getCart(String userId) {
		return toResponse(getOrCreateActiveCart(userId));
	}

	@Override
	public CartResponse addItem(String userId, AddCartItemRequest request) {
		Cart cart = getOrCreateActiveCart(userId);
		ProductSnapshot product = fetchProduct(request.productId());
		CartItem item = cart.getItems().stream()
				.filter(existing -> existing.getProductId().equals(request.productId()))
				.findFirst()
				.orElseGet(() -> {
					CartItem created = new CartItem();
					created.setCart(cart);
					created.setProductId(request.productId());
					cart.getItems().add(created);
					return created;
				});

		item.setProductTitle(product.title());
		item.setUnitPrice(finalUnitPrice(product.price(), product.discount()));
		item.setDiscountPercent(defaultZero(product.discount()));
		item.setQuantity(safeQuantity(item.getQuantity()) + request.quantity());
		return toResponse(cartRepository.save(cart));
	}

	@Override
	public CartResponse updateItem(String userId, String productId, UpdateCartItemRequest request) {
		Cart cart = getOrCreateActiveCart(userId);
		CartItem item = findCartItem(cart, parseProductId(productId));
		item.setQuantity(request.quantity());
		return toResponse(cartRepository.save(cart));
	}

	@Override
	public CartResponse removeItem(String userId, String productId) {
		Cart cart = getOrCreateActiveCart(userId);
		CartItem item = findCartItem(cart, parseProductId(productId));
		cart.getItems().remove(item);
		return toResponse(cartRepository.save(cart));
	}

	@Override
	public void clearCart(String userId) {
		Cart cart = getOrCreateActiveCart(userId);
		cart.getItems().clear();
		cartRepository.save(cart);
	}

	private Cart getOrCreateActiveCart(String userId) {
		if (!StringUtils.hasText(userId)) {
			throw new BusinessRuleException("userId is required");
		}
		return cartRepository.findByUserIdAndStatus(normalizeUserId(userId), CartStatus.ACTIVE)
				.orElseGet(() -> {
					Cart cart = new Cart();
					cart.setUserId(normalizeUserId(userId));
					cart.setStatus(CartStatus.ACTIVE);
					cart.setItems(new ArrayList<>());
					return cartRepository.save(cart);
				});
	}

	private CartItem findCartItem(Cart cart, UUID productId) {
		return cart.getItems().stream()
				.filter(item -> item.getProductId().equals(productId))
				.findFirst()
				.orElseThrow(() -> new ResourceNotFoundException("Cart item not found for productId: " + productId));
	}

	private ProductSnapshot fetchProduct(UUID productId) {
		try {
			ProductSnapshot product = productClient.getProductById(productId);
			if (product == null || Boolean.FALSE.equals(product.live())) {
				throw new BusinessRuleException("Product is not available: " + productId);
			}
			return product;
		} catch (BusinessRuleException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new ExternalServiceException("Failed to load product " + productId, ex);
		}
	}

	private CartResponse toResponse(Cart cart) {
		List<CartItemResponse> items = cart.getItems().stream().map(this::toItemResponse).toList();
		BigDecimal total = items.stream()
				.map(CartItemResponse::lineTotal)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		return new CartResponse(cart.getId(), cart.getUserId(), cart.getStatus(), total, items, cart.getCreatedAt(),
				cart.getUpdatedAt(), cart.getCheckedOutAt());
	}

	private CartItemResponse toItemResponse(CartItem item) {
		return new CartItemResponse(
				item.getId(),
				item.getProductId(),
				item.getProductTitle(),
				item.getUnitPrice(),
				item.getDiscountPercent(),
				item.getQuantity(),
				item.getLineTotal());
	}

	private UUID parseProductId(String productId) {
		try {
			return UUID.fromString(productId);
		} catch (IllegalArgumentException ex) {
			throw new BusinessRuleException("Invalid productId: " + productId);
		}
	}

	private BigDecimal finalUnitPrice(Double price, Integer discount) {
		BigDecimal base = BigDecimal.valueOf(price == null ? 0.0 : price);
		BigDecimal discountFactor = BigDecimal.valueOf(100 - defaultZero(discount)).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
		return base.multiply(discountFactor).setScale(2, RoundingMode.HALF_UP);
	}

	private int safeQuantity(Integer quantity) {
		return quantity == null ? 0 : quantity;
	}

	private int defaultZero(Integer value) {
		return value == null ? 0 : value;
	}

	private String normalizeUserId(String userId) {
		return userId.trim();
	}
}

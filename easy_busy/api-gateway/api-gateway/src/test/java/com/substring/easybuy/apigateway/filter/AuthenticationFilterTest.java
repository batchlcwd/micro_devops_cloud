package com.substring.easybuy.apigateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class AuthenticationFilterTest {

    private AuthenticationFilter authenticationFilter;
    private GatewayFilterChain filterChain;
    private static final String SECRET = "5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437";

    @BeforeEach
    void setUp() {
        authenticationFilter = new AuthenticationFilter();
        ReflectionTestUtils.setField(authenticationFilter, "secretKey", SECRET);

        filterChain = mock(GatewayFilterChain.class);
        when(filterChain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
    }

    private String generateToken(UUID userId, String email, String role) {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId.toString());
        claims.put("role", role);

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(key)
                .compact();
    }

    @Test
    void testBypassPaths() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/users/api/users").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        Mono<Void> result = filter.filter(exchange, filterChain);

        StepVerifier.create(result).verifyComplete();
        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void testMissingAuthorizationHeader() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/cart-orders/api/carts").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        Mono<Void> result = filter.filter(exchange, filterChain);

        StepVerifier.create(result).verifyComplete();
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verify(filterChain, never()).filter(any());
    }

    @Test
    void testInvalidToken() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/cart-orders/api/carts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        Mono<Void> result = filter.filter(exchange, filterChain);

        StepVerifier.create(result).verifyComplete();
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verify(filterChain, never()).filter(any());
    }

    @Test
    void testValidToken() {
        UUID userId = UUID.randomUUID();
        String email = "john@example.com";
        String role = "USER";
        String token = generateToken(userId, email, role);

        MockServerHttpRequest request = MockServerHttpRequest.get("/cart-orders/api/carts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        Mono<Void> result = filter.filter(exchange, filterChain);

        StepVerifier.create(result).verifyComplete();
        verify(filterChain, times(1)).filter(any(ServerWebExchange.class));
    }

    @Test
    void testPublicPathBypass() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/products/api/public/list").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        Mono<Void> result = filter.filter(exchange, filterChain);

        StepVerifier.create(result).verifyComplete();
        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void testAdminPathSuccessForAdmin() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "admin@example.com", "ADMIN");

        MockServerHttpRequest request = MockServerHttpRequest.get("/inventories/api/admin/adjust")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        Mono<Void> result = filter.filter(exchange, filterChain);

        StepVerifier.create(result).verifyComplete();
        verify(filterChain, times(1)).filter(any(ServerWebExchange.class));
    }

    @Test
    void testAdminPathForbiddenForUser() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "user@example.com", "USER");

        MockServerHttpRequest request = MockServerHttpRequest.get("/inventories/api/admin/adjust")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        Mono<Void> result = filter.filter(exchange, filterChain);

        StepVerifier.create(result).verifyComplete();
        assertEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
        verify(filterChain, never()).filter(any());
    }

    @Test
    void testGuestPathSuccessForGuest() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "guest@example.com", "GUEST");

        MockServerHttpRequest request = MockServerHttpRequest.get("/cart-orders/api/guest/cart")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilter filter = authenticationFilter.apply(new AuthenticationFilter.Config());
        Mono<Void> result = filter.filter(exchange, filterChain);

        StepVerifier.create(result).verifyComplete();
        verify(filterChain, times(1)).filter(any(ServerWebExchange.class));
    }
}

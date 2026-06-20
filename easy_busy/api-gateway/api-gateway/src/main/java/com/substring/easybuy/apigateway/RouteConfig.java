package com.substring.easybuy.apigateway;

import com.substring.easybuy.apigateway.filter.AuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RateLimiter;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Configuration
public class RouteConfig {


    private final String productServiceId;
    private final String cartOrderServiceId;
    private final String usersServiceId;
    private final String inventoryServiceId;
    private final AuthenticationFilter authenticationFilter;

    public RouteConfig(
            @Value("${PRODUCT_SERVICE_NAME:PRODUCT-SERVICE}") String productServiceId,
            @Value("${CARD_ORDER_SERVICE_NAME:CART-ORDER-SERVICE}") String cartOrderServiceId,
            @Value("${USERS_SERVICE_NAME:users-service}") String usersServiceId,
            @Value("${INVENTORY_SERVICE_NAME:INVENTORY-SERVICE}") String inventoryServiceId,
            AuthenticationFilter authenticationFilter) {
        this.productServiceId = productServiceId;
        this.cartOrderServiceId = cartOrderServiceId;
        this.usersServiceId = usersServiceId;
        this.inventoryServiceId = inventoryServiceId;
        this.authenticationFilter = authenticationFilter;
        System.out.println(this.productServiceId);
        System.out.println(this.cartOrderServiceId);
    }

    @Bean
    public RouteLocator route(RouteLocatorBuilder builder) {
        return builder.routes()

                .route("product-route", route -> route
                        .path("/products/**").filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config())).addRequestHeader("x-api-gateway", "value from api gateway").requestRateLimiter(rateLimitConfig -> rateLimitConfig
                                .setKeyResolver(keyResolver())
                                .setRateLimiter(redisRateLimiter())
                        ).circuitBreaker(c -> c.setName("productCircuitBreaker").setFallbackUri("forward:/product-fallback")).rewritePath("/products/?(?<remaining>.*)", "/${remaining}")).uri("lb://" + productServiceId))

                .route("cart-order-route", route -> route.path("/cart-orders/**").filters(f ->
                        f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .rewritePath("/cart-orders/?(?<remaining>.*)", "/${remaining}").retry(retryConfig -> retryConfig.setRetries(3).setMethods(HttpMethod.GET, HttpMethod.POST).setBackoff(Duration.ofMillis(100), Duration.ofMillis(1000), 2, true))
                ).uri("lb://" + cartOrderServiceId))

                .route("users-route", route -> route.path("/users/**").filters(f ->
                        f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .rewritePath("/users/?(?<remaining>.*)", "/${remaining}")
                ).uri("lb://" + usersServiceId))

                .route("inventory-route", route -> route.path("/inventories/**").filters(f ->
                        f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .rewritePath("/inventories/?(?<remaining>.*)", "/${remaining}")
                ).uri("lb://" + inventoryServiceId))

                .build();
    }

    @Bean
    public KeyResolver keyResolver() {
        return exchange -> Mono.just(exchange.getRequest().getRemoteAddress().getAddress().getHostAddress());
    }


    @Bean
    public RedisRateLimiter redisRateLimiter(){
         return new RedisRateLimiter(4,4,1);
    }

}

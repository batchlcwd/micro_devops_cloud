package com.substring.easybuy.apigateway;

import com.substring.easybuy.apigateway.filter.AuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    private final String productServiceId;
    private final String cartOrderServiceId;
    private final String usersServiceId;
    private final String inventoryServiceId;
    private final String paymentServiceId;
    private final String notificationsServiceId;
    private final String aiServiceId;
    private final AuthenticationFilter authenticationFilter;

    public RouteConfig(
            @Value("${PRODUCT_SERVICE_NAME:PRODUCT-SERVICE}") String productServiceId,
            @Value("${CARD_ORDER_SERVICE_NAME:CART-ORDER-SERVICE}") String cartOrderServiceId,
            @Value("${USERS_SERVICE_NAME:USERS-SERVICE}") String usersServiceId,
            @Value("${INVENTORY_SERVICE_NAME:INVENTORY-SERVICE}") String inventoryServiceId,
            @Value("${PAYMENT_SERVICE_NAME:PAYMENT-SERVICE}") String paymentServiceId,
            @Value("${NOTIFICATIONS_SERVICE_NAME:NOTIFICATIONS-SERVICE}") String notificationsServiceId,
            @Value("${AI_SERVICE_NAME:AI-SERVICE}") String aiServiceId,
            AuthenticationFilter authenticationFilter) {
        this.productServiceId = productServiceId;
        this.cartOrderServiceId = cartOrderServiceId;
        this.usersServiceId = usersServiceId;
        this.inventoryServiceId = inventoryServiceId;
        this.paymentServiceId = paymentServiceId;
        this.notificationsServiceId = notificationsServiceId;
        this.aiServiceId = aiServiceId;
        this.authenticationFilter = authenticationFilter;
    }

    @Bean
    public RouteLocator route(RouteLocatorBuilder builder) {
        return builder.routes()

                .route("product-route", route -> route
                        .path("/products/**")
                        .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .addRequestHeader("x-api-gateway", "value from api gateway")
                                .rewritePath("/products/?(?<remaining>.*)", "/${remaining}")
                        )
                        .uri("lb://" + productServiceId))

                .route("cart-order-route", route -> route
                        .path("/cart-orders/**")
                        .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .rewritePath("/cart-orders/?(?<remaining>.*)", "/${remaining}")
                        )
                        .uri("lb://" + cartOrderServiceId))

                .route("users-route", route -> route
                        .path("/users/**")
                        .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .rewritePath("/users/?(?<remaining>.*)", "/${remaining}")
                        )
                        .uri("lb://" + usersServiceId))

                .route("inventory-route", route -> route
                        .path("/inventories/**")
                        .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .rewritePath("/inventories/?(?<remaining>.*)", "/${remaining}")
                        )
                        .uri("lb://" + inventoryServiceId))

                .route("payment-route", route -> route
                        .path("/payments/**")
                        .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .rewritePath("/payments/?(?<remaining>.*)", "/${remaining}")
                        )
                        .uri("lb://" + paymentServiceId))

                .route("notifications-route", route -> route
                        .path("/notifications/**")
                        .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .rewritePath("/notifications/?(?<remaining>.*)", "/${remaining}")
                        )
                        .uri("lb://" + notificationsServiceId))

                .route("ai-route", route -> route
                        .path("/ai/**")
                        .filters(f -> f.filter(authenticationFilter.apply(new AuthenticationFilter.Config()))
                                .rewritePath("/ai/?(?<remaining>.*)", "/${remaining}")
                        )
                        .uri("lb://" + aiServiceId))

                .build();
    }
}

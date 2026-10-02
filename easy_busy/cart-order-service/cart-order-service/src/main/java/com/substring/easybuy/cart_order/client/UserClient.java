package com.substring.easybuy.cart_order.client;

import com.substring.easybuy.cart_order.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "${USERS_SERVICE_NAME:USERS-SERVICE}", url = "${USERS_SERVICE_URL:http://localhost:8080}")
public interface UserClient {

    @GetMapping("/api/users/{id}")
    UserDto getUserById(@PathVariable("id") UUID id);

    @GetMapping("/api/users/email/{email}")
    UserDto getUserByEmail(@PathVariable("email") String email);
}

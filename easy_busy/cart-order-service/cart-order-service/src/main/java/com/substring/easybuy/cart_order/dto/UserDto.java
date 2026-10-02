package com.substring.easybuy.cart_order.dto;

import java.util.UUID;

public record UserDto(
    UUID id,
    String name,
    String email,
    String phoneNumber,
    String address
) {}

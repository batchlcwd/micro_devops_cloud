package com.substring.blogapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TokenResponse {

    private  String accessToken;
    private  String refreshToken;
    private  UserDto user;


}

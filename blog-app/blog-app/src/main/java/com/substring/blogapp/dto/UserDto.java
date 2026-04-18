package com.substring.blogapp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.substring.blogapp.entity.Role;
import lombok.Data;

@Data
public class UserDto {
    private int id;
    private  String name;
    private String email;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Role role;
    private  Boolean enabled;
}

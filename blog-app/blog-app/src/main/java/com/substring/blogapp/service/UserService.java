package com.substring.blogapp.service;

import com.substring.blogapp.dto.UserDto;

public interface UserService {

    UserDto registerUser(UserDto userDto);

    UserDto delete(Long userId);
}

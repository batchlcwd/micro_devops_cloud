package com.substring.blogapp.service.impl;

import com.substring.blogapp.dto.UserDto;
import com.substring.blogapp.entity.Role;
import com.substring.blogapp.entity.User;
import com.substring.blogapp.exception.ResourceNotFoundException;
import com.substring.blogapp.repository.UserRepository;
import com.substring.blogapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService
{
    private  final UserRepository userRepository;
    private  final PasswordEncoder passwordEncoder;
    private  final ModelMapper modelMapper;
    @Override
    public UserDto registerUser(UserDto userDto) {
        //
        User user= modelMapper.map(userDto,User.class);
        validateUser(user);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.ROLE_GUEST);
        user.setEnabled(true);
        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser,UserDto.class);
    }

    @Override
    public UserDto delete(Long userId) {
        return null;
    }

    private void validateUser(User user) {
        User user1 = userRepository.findByEmail(user.getEmail()).orElse(null);
        if (user1 != null) {
            throw new ResourceNotFoundException("User with email " + user.getEmail() + " already exists");
        }
    }
}

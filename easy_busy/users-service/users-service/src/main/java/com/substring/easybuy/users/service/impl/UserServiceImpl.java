package com.substring.easybuy.users.service.impl;

import com.substring.easybuy.users.dto.LoginRequest;
import com.substring.easybuy.users.dto.LoginResponse;
import com.substring.easybuy.users.dto.TokenRefreshRequest;
import com.substring.easybuy.users.dto.TokenRefreshResponse;
import com.substring.easybuy.users.dto.UserDto;
import com.substring.easybuy.users.entity.Role;
import com.substring.easybuy.users.entity.User;
import com.substring.easybuy.users.exception.InvalidRequestException;
import com.substring.easybuy.users.exception.ResourceNotFoundException;
import com.substring.easybuy.users.repository.UserRepository;
import com.substring.easybuy.users.service.JwtService;
import com.substring.easybuy.users.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public UserDto createUser(UserDto userDto) {
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new InvalidRequestException("Email already in use: " + userDto.getEmail());
        }

        User user = new User();
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setPhoneNumber(userDto.getPhoneNumber());
        user.setAddress(userDto.getAddress());
        user.setRole(Role.GUEST);

//        if (userRepository.findAll().isEmpty()) {
//            user.setRole(Role.ADMIN);
//        } else {
//            user.setRole(Role.GUEST);
//        }


//        if (userDto.getRole() != null) {
//            user.setRole(userDto.getRole());
//        }

        User savedUser = userRepository.save(user);
        return toDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return toDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto updateUser(UUID id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (userDto.getEmail() != null && !userDto.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(userDto.getEmail())) {
                throw new InvalidRequestException("Email already in use: " + userDto.getEmail());
            }
            user.setEmail(userDto.getEmail());
        }

        if (userDto.getName() != null) {
            user.setName(userDto.getName());
        }
        if (userDto.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        if (userDto.getPhoneNumber() != null) {
            user.setPhoneNumber(userDto.getPhoneNumber());
        }
        if (userDto.getAddress() != null) {
            user.setAddress(userDto.getAddress());
        }
        if (userDto.getRole() != null) {
            user.setRole(userDto.getRole());
        }

        User updatedUser = userRepository.save(user);
        return toDto(updatedUser);
    }

    @Override
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }

    @Override
    public void changeUserRole(UUID id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setRole(role);
        userRepository.save(user);
    }

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new InvalidRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new InvalidRequestException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setAccessToken(accessToken);
        loginResponse.setRefreshToken(refreshToken);
        loginResponse.setUser(toDto(user));

        return loginResponse;
    }

    @Override
    public TokenRefreshResponse refreshToken(TokenRefreshRequest refreshRequest) {
        String refreshToken = refreshRequest.getRefreshToken();
        String email = jwtService.extractUsername(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for the given refresh token"));

        if (!jwtService.isTokenValid(refreshToken, user.getEmail())) {
            throw new InvalidRequestException("Invalid or expired refresh token");
        }

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtService.generateRefreshToken(user.getEmail());

        TokenRefreshResponse refreshResponse = new TokenRefreshResponse();
        refreshResponse.setAccessToken(newAccessToken);
        refreshResponse.setRefreshToken(newRefreshToken);

        return refreshResponse;
    }

    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPassword(user.getPassword());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setAddress(user.getAddress());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}

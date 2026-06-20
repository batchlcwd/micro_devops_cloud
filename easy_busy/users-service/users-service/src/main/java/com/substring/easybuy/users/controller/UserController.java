package com.substring.easybuy.users.controller;

import com.substring.easybuy.users.dto.ChangeRoleRequest;
import com.substring.easybuy.users.dto.LoginRequest;
import com.substring.easybuy.users.dto.LoginResponse;
import com.substring.easybuy.users.dto.TokenRefreshRequest;
import com.substring.easybuy.users.dto.TokenRefreshResponse;
import com.substring.easybuy.users.dto.UserDto;
import com.substring.easybuy.users.entity.Role;
import com.substring.easybuy.users.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserDto userDto) {
        return new ResponseEntity<>(userService.createUser(userDto), HttpStatus.CREATED);
    }


    //this will actually login
    //authenticate--> email, password match kar hai hai.
    //token[accessToken, refreshToken]
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(userService.login(loginRequest));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refresh(@Valid @RequestBody TokenRefreshRequest refreshRequest) {
        return ResponseEntity.ok(userService.refreshToken(refreshRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDto> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable UUID id, @Valid @RequestBody UserDto userDto) {
        return ResponseEntity.ok(userService.updateUser(id, userDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/change-role")
    public ResponseEntity<Void> updateRole(@RequestBody ChangeRoleRequest changeRoleRequest) {
        userService.changeUserRole(changeRoleRequest.userId(), changeRoleRequest.role());
        return ResponseEntity.noContent().build();
    }
}

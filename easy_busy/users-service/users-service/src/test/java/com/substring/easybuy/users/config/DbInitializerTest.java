package com.substring.easybuy.users.config;

import com.substring.easybuy.users.entity.Role;
import com.substring.easybuy.users.entity.User;
import com.substring.easybuy.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DbInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private DbInitializer dbInitializer;

    @BeforeEach
    void setUp() {
        dbInitializer = new DbInitializer(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(dbInitializer, "adminEmail", "admin@gmail.com");
        ReflectionTestUtils.setField(dbInitializer, "adminPassword", "admin123");
        ReflectionTestUtils.setField(dbInitializer, "adminName", "Admin User");
    }

    @Test
    void run_createsAdminUser_whenAdminDoesNotExist() throws Exception {
        when(userRepository.existsByEmail("admin@gmail.com")).thenReturn(false);
        when(passwordEncoder.encode("admin123")).thenReturn("encodedPassword");

        dbInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals("Admin User", savedUser.getName());
        assertEquals("admin@gmail.com", savedUser.getEmail());
        assertEquals("encodedPassword", savedUser.getPassword());
        assertEquals(Role.ADMIN, savedUser.getRole());
    }

    @Test
    void run_doesNotCreateUser_whenAdminAlreadyExists() throws Exception {
        when(userRepository.existsByEmail("admin@gmail.com")).thenReturn(true);

        dbInitializer.run();

        verify(userRepository, never()).save(any(User.class));
    }
}

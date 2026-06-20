package com.substring.easybuy.users.service;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437");
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 3600000L);
        ReflectionTestUtils.setField(jwtService, "refreshTokenExpiration", 604800000L);
    }

    @Test
    void testGenerateAndValidateAccessToken() {
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        String role = "ADMIN";

        String token = jwtService.generateAccessToken(userId, email, role);
        assertNotNull(token);

        String username = jwtService.extractUsername(token);
        assertEquals(email, username);

        Claims claims = jwtService.extractAllClaims(token);
        assertEquals(userId.toString(), claims.get("userId"));
        assertEquals(role, claims.get("role"));

        assertTrue(jwtService.isTokenValid(token, email));
        assertFalse(jwtService.isTokenValid(token, "other@example.com"));
    }

    @Test
    void testGenerateAndValidateRefreshToken() {
        String email = "test@example.com";

        String token = jwtService.generateRefreshToken(email);
        assertNotNull(token);

        String username = jwtService.extractUsername(token);
        assertEquals(email, username);

        assertTrue(jwtService.isTokenValid(token, email));
    }
}

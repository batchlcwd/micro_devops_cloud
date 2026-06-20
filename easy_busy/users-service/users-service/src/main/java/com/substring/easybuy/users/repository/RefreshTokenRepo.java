package com.substring.easybuy.users.repository;

import com.substring.easybuy.users.entity.RefreshToken;
import com.substring.easybuy.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepo extends JpaRepository<RefreshToken, String> {

    Optional<RefreshToken> findByRefreshToken(String refreshToken);

    Optional<RefreshToken> findByRefreshTokenAndUserId(String refreshToken, String userId);

    Optional<RefreshToken> findByUser(User user);

}

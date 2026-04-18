package com.substring.blogapp.repository;

import com.substring.blogapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

//all CRUD functionality
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
}

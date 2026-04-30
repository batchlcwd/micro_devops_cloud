package com.substring.blogapp.controller;

import com.substring.blogapp.dto.LoginRequest;
import com.substring.blogapp.dto.TokenResponse;
import com.substring.blogapp.dto.UserDto;
import com.substring.blogapp.entity.User;
import com.substring.blogapp.repository.UserRepository;
import com.substring.blogapp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.swing.*;


@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {


    private final AuthenticationManager authenticationManager;

    private final UserRepository userRepository;
    private  final ModelMapper modelMapper;

    private  final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> generateToken(@RequestBody LoginRequest loginRequest) {

        //we need to authentication
        try {

            //fetch user from db
            //db user password compare karein with login mein email and password
            //AuthenticationManager
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword());
            authenticationManager.authenticate(authentication);
            User user = userRepository.findByEmail(loginRequest.getEmail()).get();

            var tokenResponse=TokenResponse.builder()
                    .accessToken(jwtService.generateAccessToken(user))
                    .refreshToken(jwtService.generateRefreshToken(user))
                    .user(modelMapper.map(user, UserDto.class))
                    .build();

            return new ResponseEntity<>(tokenResponse, HttpStatus.CREATED);

        } catch (AuthenticationException ex) {
            ex.printStackTrace();
            throw new BadCredentialsException("Invalid username and password");
        }




    }
}

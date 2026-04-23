package com.substring.blogapp.security;

import com.mysql.cj.log.Log;
import com.substring.blogapp.entity.Role;
import com.substring.blogapp.entity.User;
import com.substring.blogapp.exception.ResourceNotFoundException;
import com.substring.blogapp.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ModelMapper modelMapper;
    private Logger logger = LoggerFactory.getLogger(this.getClass());
    private final UserRepository userRepository;


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {


        String token = request.getHeader("Authorization");
        logger.debug("JWT Token: {}", token);
        if (token != null && token.startsWith("Bearer ")) {

            //process
            String tokenValue = token.substring(7);
            try {

                if (jwtService.isAccessToken(tokenValue)) {


                    Jws<Claims> parse = jwtService.parse(tokenValue);
                    Claims payload = jwtService.getPayload(tokenValue);
                    String userId = payload.getSubject();

                    User user = userRepository.findById(Long.parseLong(userId)).orElseThrow(() -> new ResourceNotFoundException("user not found of given token"));
                    if (user.getEnabled()) {

                        Role role = user.getRole();
                        List<GrantedAuthority> authorities = role == null ? List.of() : List.of(new SimpleGrantedAuthority(role.name()));
                        //authentication security mein set karna
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user, null, authorities);
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        //this line is very important
                        SecurityContextHolder.getContext().setAuthentication(authentication);

                    }


                }


            } catch (Exception e) {
                e.printStackTrace();
            }

        }


        filterChain.doFilter(request, response);
    }
}

package com.substring.blogapp.security;

import com.substring.blogapp.entity.User;
import com.substring.blogapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        //operations--> db operations--> user
        User user = userRepository.findByEmail(username).orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new CustomUserDetail(user);
    }
}

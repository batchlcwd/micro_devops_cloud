package com.substring.blogapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid Email Address")
//    @Pattern(regexp = "")
    private String email;
    @NotBlank(message = "Password is required")
    @Size(min = 3,message = "Min 2 characters required")
    private String password;
}

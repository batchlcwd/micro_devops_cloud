package com.substring.easybuy.notifications.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record EmailRequest(
    @NotBlank(message = "Recipient email is required")
    @Email(message = "Invalid email format")
    String toEmail,
    
    @NotBlank(message = "Subject is required")
    String subject,
    
    @NotBlank(message = "Message body or template name is required")
    String body,
    
    Map<String, Object> templateModel
) {}

package com.substring.easybuy.notifications.service;

import com.substring.easybuy.notifications.dto.EmailRequest;

public interface NotificationService {
    void sendEmail(EmailRequest request);
    void sendOrderConfirmation(String toEmail, Long orderId, String orderNumber, java.math.BigDecimal amount);
    void sendPaymentFailureWarning(String toEmail, Long orderId, String reason);
    void sendWelcomeEmail(String toEmail, String name);
}

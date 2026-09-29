package com.substring.easybuy.notifications.service;

import com.substring.easybuy.notifications.dto.EmailRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender;

    public NotificationServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendEmail(EmailRequest request) {
        log.info("Sending email to: {} with subject: {}", request.toEmail(), request.subject());
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("easybuy-notifications@example.com");
            message.setTo(request.toEmail());
            message.setSubject(request.subject());
            message.setText(request.body());
            
            mailSender.send(message);
            log.info("Email sent successfully to: {}", request.toEmail());
        } catch (Exception e) {
            log.error("Failed to send email to: {}. Error: {}", request.toEmail(), e.getMessage());
            // We log and do not rethrow, as notification failure shouldn't crash checkout saga.
        }
    }

    @Override
    public void sendOrderConfirmation(String toEmail, Long orderId, String orderNumber, BigDecimal amount) {
        String subject = "Order Confirmation - Easy Buy";
        String body = String.format(
            "Dear Customer,\n\n" +
            "Thank you for your order! Your order has been placed successfully.\n\n" +
            "Order Details:\n" +
            "- Order ID: %d\n" +
            "- Order Number: %s\n" +
            "- Total Amount: INR %s\n\n" +
            "We are preparing your items for shipping. You will receive another notification when your package ships.\n\n" +
            "Best Regards,\n" +
            "Easy Buy Team",
            orderId, orderNumber, amount.toString()
        );
        sendEmail(new EmailRequest(toEmail, subject, body, null));
    }

    @Override
    public void sendPaymentFailureWarning(String toEmail, Long orderId, String reason) {
        String subject = "Payment Failed for Order #" + orderId + " - Easy Buy";
        String body = String.format(
            "Dear Customer,\n\n" +
            "We were unable to process the payment for your order ID: %d.\n" +
            "Reason for failure: %s\n\n" +
            "Please check your payment details or try again with a different payment method to confirm your order.\n\n" +
            "Best Regards,\n" +
            "Easy Buy Team",
            orderId, reason
        );
        sendEmail(new EmailRequest(toEmail, subject, body, null));
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String name) {
        String subject = "Welcome to Easy Buy!";
        String body = String.format(
            "Dear %s,\n\n" +
            "Welcome to Easy Buy! Your account has been registered successfully.\n\n" +
            "Enjoy shopping from a wide variety of products with amazing deals.\n\n" +
            "Best Regards,\n" +
            "Easy Buy Team",
            name
        );
        sendEmail(new EmailRequest(toEmail, subject, body, null));
    }
}

package com.substring.easybuy.notifications.controller;

import com.substring.easybuy.notifications.dto.EmailRequest;
import com.substring.easybuy.notifications.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/email")
    public ResponseEntity<String> sendEmail(@Valid @RequestBody EmailRequest request) {
        notificationService.sendEmail(request);
        return ResponseEntity.ok("Email sent request processed.");
    }

    @PostMapping("/welcome")
    public ResponseEntity<String> sendWelcome(@RequestParam String email, @RequestParam String name) {
        notificationService.sendWelcomeEmail(email, name);
        return ResponseEntity.ok("Welcome email sent request processed.");
    }
}

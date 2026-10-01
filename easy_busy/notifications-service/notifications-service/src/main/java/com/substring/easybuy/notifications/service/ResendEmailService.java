package com.substring.easybuy.notifications.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ResendEmailService {

    @Value("${resend.api-key:re_default_key}")
    private String apiKey;

    @Value("${resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${resend.api-url:https://api.resend.com/emails}")
    private String apiUrl;

    @Value("${resend.enabled:true}")
    private boolean resendEnabled;

    private final RestClient restClient = RestClient.create();

    public boolean sendEmailViaResend(String to, String subject, String body) {
        if (!resendEnabled || apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("re_default_key")) {
            log.warn("Resend API key is not configured or Resend is disabled (api-key: {}). Falling back to SMTP.", apiKey);
            return false;
        }

        try {
            log.info("Sending email via Resend API to: {} with subject: {}", to, subject);
            
            String htmlContent = "<div style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">"
                    + body.replace("\n", "<br/>")
                    + "</div>";

            Map<String, Object> payload = Map.of(
                    "from", fromEmail,
                    "to", List.of(to),
                    "subject", subject,
                    "text", body,
                    "html", htmlContent
            );

            String response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            log.info("Resend email sent successfully to: {}. Response payload: {}", to, response);
            return true;
        } catch (Exception e) {
            log.error("Failed to send email via Resend API to {}: {}", to, e.getMessage());
            return false;
        }
    }
}

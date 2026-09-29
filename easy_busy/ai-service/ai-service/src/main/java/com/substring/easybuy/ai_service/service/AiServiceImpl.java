package com.substring.easybuy.ai_service.service;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Arrays;

@Slf4j
@Service
public class AiServiceImpl implements AiService {

    private final ChatModel chatModel;

    // Optional autowire to support cases where OpenAI bean isn't fully configured
    public AiServiceImpl(@Autowired(required = false) ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @Override
    public List<String> getRecommendations(String userId) {
        log.info("Generating recommendations for user: {}", userId);
        
        if (chatModel != null) {
            try {
                String prompt = "Recommend 5 e-commerce product categories (comma separated) for user with ID: " + userId + " who bought electronics.";
                String response = chatModel.call(prompt);
                if (response != null && !response.trim().isEmpty()) {
                    return Arrays.asList(response.split(",\\s*"));
                }
            } catch (Exception e) {
                log.warn("Spring AI call failed, falling back to mock recommendations: {}", e.getMessage());
            }
        }
        
        // Mock fallback recommendations
        return List.of("Electronics", "Smart Watches", "Fitness Trackers", "Headphones", "Accessories");
    }

    @Override
    public String generateDescription(String title, String category) {
        log.info("Generating description for product: {} in category: {}", title, category);
        
        if (chatModel != null) {
            try {
                String prompt = String.format("Generate a short description for a product titled '%s' in the category '%s'.", title, category);
                String response = chatModel.call(prompt);
                if (response != null && !response.trim().isEmpty()) {
                    return response.trim();
                }
            } catch (Exception e) {
                log.warn("Spring AI call failed, falling back to mock description generation: {}", e.getMessage());
            }
        }
        
        // Mock fallback description
        return String.format("This is an exceptional %s. Designed with state-of-the-art materials, the %s offers great features, high performance, and outstanding value for your daily lifestyle.", title, title);
    }
}

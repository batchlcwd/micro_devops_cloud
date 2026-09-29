package com.substring.easybuy.ai_service.controller;

import com.substring.easybuy.ai_service.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<List<String>> getRecommendations(@PathVariable String userId) {
        return ResponseEntity.ok(aiService.getRecommendations(userId));
    }

    @PostMapping("/generate-description")
    public ResponseEntity<Map<String, String>> generateDescription(
            @RequestParam String title,
            @RequestParam String category) {
        String description = aiService.generateDescription(title, category);
        return ResponseEntity.ok(Map.of("description", description));
    }
}

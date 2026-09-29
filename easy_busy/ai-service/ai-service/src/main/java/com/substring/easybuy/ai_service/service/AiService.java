package com.substring.easybuy.ai_service.service;

import java.util.List;

public interface AiService {
    List<String> getRecommendations(String userId);
    String generateDescription(String title, String category);
}

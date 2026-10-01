package com.substring.easybuy.apigateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Registers a CorsWebFilter so browser preflight (OPTIONS) requests get a CORS
 * response before they ever reach route matching or AuthenticationFilter -
 * preflight requests never carry the Authorization header, so if this ran
 * after auth, every credentialed cross-origin call to a protected route would
 * fail the preflight and never even attempt the real request.
 *
 * FRONTEND_ORIGINS is a comma-separated list, e.g.
 * "https://app.easybuy.com,http://localhost:3000".
 */
@Configuration
public class CorsConfig {

    @Value("${FRONTEND_ORIGINS:http://localhost:5173}")
    private String frontendOrigins;

    @Bean
    public CorsWebFilter corsWebFilter() {
        List<String> origins = Arrays.stream(frontendOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}

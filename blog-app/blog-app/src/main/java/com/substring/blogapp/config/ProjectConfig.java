package com.substring.blogapp.config;

import com.substring.blogapp.utils.ArticleModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProjectConfig {

    @Bean
    public ArticleModelMapper articleModelMapper() {
        return new ArticleModelMapper();
    }
}

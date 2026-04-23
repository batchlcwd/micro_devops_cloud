package com.substring.blogapp.config;

import com.substring.blogapp.utils.ArticleModelMapper;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.ui.ModelMap;

@Configuration
public class ProjectConfig {

    @Bean
    public ArticleModelMapper articleModelMapper() {
        return new ArticleModelMapper();
    }

    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }

}

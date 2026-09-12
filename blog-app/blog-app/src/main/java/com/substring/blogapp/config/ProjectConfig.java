package com.substring.blogapp.config;

import com.substring.blogapp.utils.ArticleModelMapper;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
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


//    @Bean
//    public OpenAPI customOpenAPI() {
//
//        return new OpenAPI()
//                .info(new Info()
//                        .title("Blog App Backend")
//                        .version("1.0")
//                        .description("REST API documentation for blog app Service"));
//    }


    @Bean
    public OpenAPI customOpenAPI() {

        return new OpenAPI()
                .info(new Info()
                        .title("My Application API")
                        .version("1.0")
                        .description("API documentation"))

                .addSecurityItem(
                        new SecurityRequirement()
                                .addList("bearerAuth")
                )

                .components(
                        new Components()
                                .addSecuritySchemes(
                                        "bearerAuth",
                                        new SecurityScheme()
                                                .name("Authorization")
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                )
                );
    }


}

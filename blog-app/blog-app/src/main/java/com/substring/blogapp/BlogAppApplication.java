package com.substring.blogapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
//Configuration
//EnableAutoConfiguration
//ComponentScan("package name")
public class BlogAppApplication {
	public static void main(String[] args) {

        //spring application bootstrap :
		SpringApplication.run(BlogAppApplication.class, args);
	}
}

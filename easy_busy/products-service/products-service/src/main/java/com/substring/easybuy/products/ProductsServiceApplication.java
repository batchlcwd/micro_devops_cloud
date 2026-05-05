package com.substring.easybuy.products;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.TimeZone;

@EnableJpaAuditing
@SpringBootApplication
public class ProductsServiceApplication {

	public static void main(String[] args) {

		System.out.println("JVM Timezone "+TimeZone.getDefault());

//		IO.println("JVM Timezone"+TimeZone.getDefault());
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));


		//This line actually starts application
		SpringApplication.run(ProductsServiceApplication.class, args);

	}


}

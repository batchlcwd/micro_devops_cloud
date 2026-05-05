package com.substring.easybuy.products;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class ProductsServiceApplication {

	public static void main(String[] args) {
		IO.println("JVM Timezone"+TimeZone.getDefault());
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(ProductsServiceApplication.class, args);

	}


}

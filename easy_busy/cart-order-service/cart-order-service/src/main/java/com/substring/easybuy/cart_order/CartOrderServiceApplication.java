package com.substring.easybuy.cart_order;

import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableFeignClients
@EnableKafka
public class CartOrderServiceApplication {

	public static void main(String[] args) {

		SpringApplication.run(CartOrderServiceApplication.class, args);
	}

}

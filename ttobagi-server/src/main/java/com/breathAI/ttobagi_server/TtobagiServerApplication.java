package com.breathAI.ttobagi_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TtobagiServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TtobagiServerApplication.class, args);
	}

}
package com.sce.smartcampexchange;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartCampusExchangeApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCampusExchangeApplication.class, args);
    }

}
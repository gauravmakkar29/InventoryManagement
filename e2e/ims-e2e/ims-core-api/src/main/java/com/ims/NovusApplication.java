package com.ims;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.ims"})
public class NovusApplication {
    public static void main(String[] args) {
        SpringApplication.run(NovusApplication.class, args);
    }
}

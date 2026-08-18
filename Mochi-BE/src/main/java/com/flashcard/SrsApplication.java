package com.flashcard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Kích hoạt tính năng chạy Job tự động (Scheduler)
public class SrsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SrsApplication.class, args);
    }

}

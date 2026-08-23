package com.breathAI.ttobagi_server.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

// AI 서버 호출용 WebClient 설정
@Configuration
public class WebClientConfig {

    // AI 서버 주소 (환경변수 TTOBAGI_AI_SERVER)
    @Value("${ai.server.url}")
    private String aiServerUrl;

    // AI 서버를 기본 주소로 갖는 WebClient 생성
    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl(aiServerUrl)
                .build();
    }
}

package com.dnproject.platform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    // application.yml에서 값을 주입받는다
    // 기본값: "http://localhost:5173,http://localhost:3000"
    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 1. 허용할 출처: 프론트엔드 도메인만 허용 (ex: localhost:5173)
        // -> allowedOrigins 변수는 application.yml에서 가져옴
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));

        // 2. 허용할 메서드: 모든 주요 HTTP 메서드 허용
        // -> GET, POST, PUT, PATCH, DELETE, OPTIONS
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 3. 허용할 헤더: 모든 요청 헤더 허용
        // -> 클라이언트가 Authorization(토큰) 등을 보낼 수 있음
        config.setAllowedHeaders(List.of("*"));

        // 4. 자격 증명 허용: 쿠키 및 인증 헤더 포함 허용
        // -> 이게 있어야 프론트에서 withCredentials: true 로 보낸 요청을 받을 수 있음
        config.setAllowCredentials(true);

        // 5. 캐시 시간: Preflight(사전 요청) 결과를 1시간(3600초) 동안 캐시
        // -> 매번 OPTIONS 요청을 보내지 않도록 하여 성능 향상
        config.setMaxAge(3600L);

        // 설정을 모든 경로(/**)에 적용
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

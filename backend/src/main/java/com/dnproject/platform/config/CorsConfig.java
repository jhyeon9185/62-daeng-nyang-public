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

        // 1. 허용할 출처 (Origin) 설정
        // - 브라우저는 보안상의 이유로 스크립트에서 시작된 교차 출처 HTTP 요청을 제한합니다.
        // - 이 설정은 지정된 도메인(예: 프론트엔드 서버)에서의 요청을 허용합니다.
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));

        // 2. 허용할 HTTP 메서드 설정
        // - GET, POST, PUT, PATCH, DELETE, OPTIONS 메서드를 허용합니다.
        // - OPTIONS는 브라우저가 실제 요청(GET, POST 등)을 보내기 전에 안전한지 확인하는 '사전 요청(Preflight)'에
        // 사용됩니다.
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 3. 허용할 HTTP 헤더 설정
        // - "*"는 모든 헤더를 허용한다는 의미입니다.
        // - 클라이언트가 Authorization(토큰), Content-Type(JSON) 등의 헤더를 보낼 수 있게 합니다.
        config.setAllowedHeaders(List.of("*"));

        // 4. 인증 정보(Credentials) 허용 설정
        // - 쿠키, Authorization 헤더, TLS 클라이언트 인증서 등을 포함한 요청을 허용합니다.
        // - true로 설정 시, AllowedOrigins에 와일드카드("*")를 사용할 수 없고 구체적인 도메인을 명시해야 합니다.
        config.setAllowCredentials(true);

        // 5. 사전 요청(Preflight) 캐시 시간 설정 (초 단위)
        // - 브라우저가 Preflight 요청의 결과를 캐시할 시간을 1시간(3600초)으로 설정합니다.
        // - 이 시간 동안은 동일한 요청에 대해 다시 OPTIONS 요청을 보내지 않아 성능이 향상됩니다.
        config.setMaxAge(3600L);

        // 모든 경로(/**)에 대해 위에서 설정한 CORS 정책을 적용합니다.
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

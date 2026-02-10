package com.dnproject.platform.config;

import com.dnproject.platform.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final CorsConfigurationSource corsConfigurationSource;

        private static final String[] PUBLIC_PATHS = {
                        "/api/auth/signup",
                        "/api/auth/shelter-signup",
                        "/api/auth/login",
                        "/api/auth/google",
                        "/api/auth/kakao",
                        "/api/auth/refresh",
                        "/api/animals",
                        "/api/animals/**",
                        "/api/boards",
                        "/api/boards/**",
                        "/api/volunteers/recruitments",
                        "/api/volunteers/recruitments/**",
                        "/api/donations/requests",
                        "/api/donations/requests/**",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/error"
        };

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                // 1. CORS 설정 적용
                                // - Security 필터 체인 앞단에서 CORS 처리 (브라우저 preflight 요청 허용 등)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                                // 2. CSRF 비활성화 (JWT 사용이므로)
                                // - CSRF는 세션/쿠키 기반 인증에서 발생하는 취약점입니다.
                                // - JWT는 Authorization 헤더에 토큰을 담아 보내므로 CSRF 보호가 불필요합니다.
                                .csrf(AbstractHttpConfigurer::disable)

                                // 3. 세션을 사용하지 않음 (STATELESS)
                                // - 서버가 세션을 생성하거나 유지하지 않도록 설정합니다.
                                // - 모든 요청은 자체적으로 인증 정보(JWT)를 포함해야 합니다.
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // 4. URL별 접근 권한 설정 (순서 중요!)
                                .authorizeHttpRequests(auth -> auth
                                                // ① 인증 필요 경로를 먼저 선언 (PUBLIC_PATHS의 /api/animals/** 보다 구체적으로 명시)
                                                // - /api/animals/** 가 permitAll()이더라도, 이 구체적인 경로는 인증이 필요합니다.
                                                .requestMatchers("/api/animals/recommendations",
                                                                "/api/animals/recommendations/**")
                                                .authenticated()

                                                // ② 사용자 본인 정보
                                                .requestMatchers("/api/users/me/**").authenticated()

                                                // ③ 공개 경로
                                                // - 로그인/회원가입, 단순 조회(GET) 등은 인증 없이 접근 가능합니다.
                                                .requestMatchers(PUBLIC_PATHS).permitAll()

                                                // ④ SUPER_ADMIN 전용
                                                // - 특정 관리자 기능은 SUPER_ADMIN 권한을 가진 사용자만 접근 가능합니다.
                                                .requestMatchers("/api/admin/users", "/api/admin/users/**",
                                                                "/api/admin/boards", "/api/admin/boards/**")
                                                .hasRole("SUPER_ADMIN")
                                                .requestMatchers("/api/admin/applications",
                                                                "/api/admin/applications/**")
                                                .hasRole("SUPER_ADMIN")

                                                // ⑤ SUPER_ADMIN 또는 SHELTER_ADMIN
                                                // - hasAnyRole()을 사용하여 여러 권한 중 하나만 있어도 접근 허용
                                                .requestMatchers("/api/admin/**")
                                                .hasAnyRole("SUPER_ADMIN", "SHELTER_ADMIN")

                                                // ⑥ 나머지 모든 /api/** → 인증 필요
                                                // - 위 규칙에 매칭되지 않은 나머지 API 요청은 모두 인증된 사용자만 접근 가능합니다.
                                                .requestMatchers("/api/**").authenticated())

                                // 5. JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 추가
                                // - Spring Security의 기본 로그인 필터보다 먼저 실행되어, 요청 헤더의 토큰을 검사합니다.
                                .addFilterBefore(jwtAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}

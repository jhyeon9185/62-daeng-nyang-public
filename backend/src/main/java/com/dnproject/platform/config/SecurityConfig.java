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
                                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                                .csrf(AbstractHttpConfigurer::disable)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/api/animals/recommendations",
                                                                "/api/animals/recommendations/**")
                                                .authenticated()
                                                .requestMatchers("/api/users/me/**").authenticated()
                                                .requestMatchers(PUBLIC_PATHS).permitAll()
                                                // 게시판: 조회는 누구나, 작성/수정/삭제는 인증된 사용자만
                                                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/boards",
                                                                "/api/boards/**")
                                                .permitAll()
                                                .requestMatchers("/api/boards", "/api/boards/**").authenticated()
                                                .requestMatchers("/api/admin/users", "/api/admin/users/**",
                                                                "/api/admin/boards", "/api/admin/boards/**")
                                                .hasRole("SUPER_ADMIN")
                                                .requestMatchers("/api/admin/applications",
                                                                "/api/admin/applications/**")
                                                .hasRole("SUPER_ADMIN")
                                                .requestMatchers("/api/admin/**")
                                                .hasAnyRole("SUPER_ADMIN", "SHELTER_ADMIN")
                                                .requestMatchers("/api/**").authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}

---
name: spring-security
description: Creates Spring Security configurations with JWT authentication. Use when setting up authentication, authorization, security filters. Keywords: security, jwt, auth, authentication, authorization, token.
---

# Spring Security Generator

## Purpose
Generate Spring Security configurations:
- JWT-based authentication
- Role-based authorization
- Security filters
- CORS configuration

## Security Config
Location: `backend/src/main/java/com/dnproject/platform/config/SecurityConfig.java`

```java
package com.dnproject.platform.config;

import com.dnproject.platform.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configure(http))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/animals/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/boards/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/volunteers/recruitments/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/donations/requests/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                // Shelter admin endpoints
                .requestMatchers("/api/v1/shelters/**").hasAnyRole("SHELTER_ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/animals/**").hasAnyRole("SHELTER_ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/animals/**").hasAnyRole("SHELTER_ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/animals/**").hasAnyRole("SHELTER_ADMIN", "SUPER_ADMIN")
                .requestMatchers("/**/approve", "/**/reject").hasAnyRole("SHELTER_ADMIN", "SUPER_ADMIN")

                // Super admin endpoints
                .requestMatchers("/api/v1/admin/**").hasRole("SUPER_ADMIN")

                // Authenticated endpoints
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
```

## JWT Provider
Location: `backend/src/main/java/com/dnproject/platform/security/JwtProvider.java`

```java
package com.dnproject.platform.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessTokenValidityInMilliseconds;
    private final long refreshTokenValidityInMilliseconds;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity}") long accessTokenValidity,
            @Value("${jwt.refresh-token-validity}") long refreshTokenValidity) {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenValidityInMilliseconds = accessTokenValidity * 1000;
        this.refreshTokenValidityInMilliseconds = refreshTokenValidity * 1000;
    }

    public String createAccessToken(String email, String role) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + accessTokenValidityInMilliseconds);

        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(validity)
                .signWith(key)
                .compact();
    }

    public String createRefreshToken(String email) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + refreshTokenValidityInMilliseconds);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(validity)
                .signWith(key)
                .compact();
    }

    public String getEmail(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public String getRole(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

## JWT Authentication Filter
Location: `backend/src/main/java/com/dnproject/platform/security/JwtAuthenticationFilter.java`

```java
package com.dnproject.platform.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = resolveToken(request);

        if (StringUtils.hasText(token) && jwtProvider.validateToken(token)) {
            String email = jwtProvider.getEmail(token);
            String role = jwtProvider.getRole(token);

            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
            var userDetails = userDetailsService.loadUserByUsername(email);

            var authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

## UserDetailsService Implementation
Location: `backend/src/main/java/com/dnproject/platform/security/UserDetailsServiceImpl.java`

```java
package com.dnproject.platform.security;

import com.dnproject.platform.domain.User;
import com.dnproject.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
```

## CORS Config
Location: `backend/src/main/java/com/dnproject/platform/config/CorsConfig.java`

```java
package com.dnproject.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

## Application Properties
```yaml
# JWT Configuration
jwt:
  secret: ${JWT_SECRET:your-256-bit-secret-key-here-base64-encoded}
  access-token-validity: 3600      # 1 hour in seconds
  refresh-token-validity: 604800   # 7 days in seconds
```

## Role-Based Access Control

| Role | Access Level |
|------|-------------|
| USER | - View animals, boards, recruitments, donation requests |
|      | - Apply for adoption, volunteer, donation |
|      | - Manage own applications |
| SHELTER_ADMIN | - All USER permissions |
|               | - Create/manage animals (manual entry) |
|               | - Create volunteer recruitments |
|               | - Create donation requests |
|               | - Approve/reject applications |
| SUPER_ADMIN | - All SHELTER_ADMIN permissions |
|             | - Manage users |
|             | - Verify shelters |
|             | - Manage all boards |

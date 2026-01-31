package com.dnproject.platform.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtProvider {

    private final SecretKey accessKey;
    private final SecretKey refreshKey;
    private final long accessValidityMs;
    private final long refreshValidityMs;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity:3600}") long accessValiditySeconds,
            @Value("${jwt.refresh-token-validity:604800}") long refreshValiditySeconds) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            keyBytes = java.util.Arrays.copyOf(keyBytes, 32);
        }
        this.accessKey = Keys.hmacShaKeyFor(keyBytes);
        this.refreshKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessValidityMs = accessValiditySeconds * 1000L;
        this.refreshValidityMs = refreshValiditySeconds * 1000L;
    }

    public String createAccessToken(String email, String role, Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessValidityMs);
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(accessKey)
                .compact();
    }

    public String createRefreshToken(String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshValidityMs);
        return Jwts.builder()
                .subject(email)
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(refreshKey)
                .compact();
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(accessKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims parseRefreshToken(String token) {
        return Jwts.parser()
                .verifyWith(refreshKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateAccessToken(String token) {
        try {
            parseAccessToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = parseRefreshToken(token);
            return "refresh".equals(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public long getAccessValiditySeconds() {
        return accessValidityMs / 1000;
    }
}

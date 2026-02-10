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

        // 🔐 JWT 서명을 위한 비밀 키 생성
        // - HMAC-SHA256 알고리즘을 사용하려면 최소 32바이트 이상의 키가 필요합니다.
        // - 제공된 secret 문자열을 바이트 배열로 변환하고, 길이가 부족하면 패딩을 추가하여 안전한 키를 만듭니다.
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            keyBytes = java.util.Arrays.copyOf(keyBytes, 32); // 부족하면 0으로 채움
        }

        // Access Token과 Refresh Token 서명에 동일한 키를 사용합니다. (보안 강화를 위해 분리할 수도 있음)
        this.accessKey = Keys.hmacShaKeyFor(keyBytes);
        this.refreshKey = Keys.hmacShaKeyFor(keyBytes);

        // 만료 시간 설정 (초 단위 → 밀리초 단위 변환)
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

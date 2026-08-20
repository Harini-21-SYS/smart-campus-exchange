package com.sce.smartcampexchange.security;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private static final String SECRET_KEY =
            "SmartCampusExchangeJwtSecretKey2026ForFinalYearProject";

    private static final long EXPIRATION_TIME =
            1000L * 60 * 60 * 24; // 24 hours

    private final Key key =
            Keys.hmacShaKeyFor(
                    SECRET_KEY.getBytes(StandardCharsets.UTF_8));

    public String generateToken(String email) {

        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {

        return extractClaims(token).getSubject();
    }

    public boolean validateToken(String token) {

        try {

            Claims claims = extractClaims(token);

            Date expiration = claims.getExpiration();

            if (expiration.before(new Date())) {

                System.out.println("JWT EXPIRED");

                return false;
            }

            return true;

        } catch (Exception e) {

            System.out.println(
                    "JWT VALIDATION ERROR: "
                            + e.getClass().getSimpleName());

            System.out.println(
                    "JWT VALIDATION MESSAGE: "
                            + e.getMessage());

            return false;
        }
    }

    private Claims extractClaims(String token) {

        return Jwts.parser()
                .verifyWith(
                        (javax.crypto.SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
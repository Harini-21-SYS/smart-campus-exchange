package com.sce.smartcampexchange.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sce.smartcampexchange.service.CustomUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtUtil jwtUtil,
            CustomUserDetailsService userDetailsService) {

        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

    	// =========================================
    	// ALLOW CORS PREFLIGHT REQUEST
    	// =========================================

    	if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {

    	    System.out.println("CORS PREFLIGHT REQUEST - OPTIONS");

    	    filterChain.doFilter(request, response);

    	    return;
    	}
    	
        // =========================================
        // 1. GET AUTHORIZATION HEADER
        // =========================================

        String authHeader =
                request.getHeader("Authorization");

        System.out.println("=================================");
        System.out.println("JWT FILTER");
        System.out.println(
                "Request URI: "
                        + request.getRequestURI());

        System.out.println(
                "Authorization Header: "
                        + authHeader);


        String token = null;
        String email = null;


        // =========================================
        // 2. CHECK BEARER TOKEN
        // =========================================

        if (authHeader != null
                && authHeader.startsWith("Bearer ")) {

            token = authHeader.substring(7);

            System.out.println(
                    "Token received: YES");


            // =========================================
            // 3. EXTRACT EMAIL FROM JWT
            // =========================================

            try {

                email =
                        jwtUtil.extractEmail(token);

                System.out.println(
                        "Extracted email: "
                                + email);

            } catch (Exception e) {

                System.out.println(
                        "JWT EXTRACT ERROR: "
                                + e.getClass()
                                        .getSimpleName());

                System.out.println(
                        "JWT EXTRACT MESSAGE: "
                                + e.getMessage());

                filterChain.doFilter(
                        request,
                        response);

                return;
            }

        } else {

            System.out.println(
                    "Authorization header missing or invalid");
        }


        // =========================================
        // 4. LOAD USER
        // =========================================

        if (email != null
                && SecurityContextHolder
                        .getContext()
                        .getAuthentication() == null) {

            try {

                UserDetails userDetails =
                        userDetailsService
                                .loadUserByUsername(email);

                System.out.println(
                        "User found: "
                                + userDetails.getUsername());

                System.out.println(
                        "Authorities: "
                                + userDetails
                                        .getAuthorities());


                // =========================================
                // 5. VALIDATE JWT
                // =========================================

                boolean valid =
                        jwtUtil.validateToken(token);

                System.out.println(
                        "JWT Valid: "
                                + valid);


                // =========================================
                // 6. SET AUTHENTICATION
                // =========================================

                if (valid) {

                    UsernamePasswordAuthenticationToken
                            authenticationToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails
                                            .getAuthorities());

                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request));


                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(
                                    authenticationToken);


                    System.out.println(
                            "AUTHENTICATION SUCCESS");
                }

            } catch (Exception e) {

                System.out.println(
                        "USER AUTHENTICATION ERROR: "
                                + e.getClass()
                                        .getSimpleName());

                System.out.println(
                        "USER AUTHENTICATION MESSAGE: "
                                + e.getMessage());
            }
        }


        // =========================================
        // 7. CHECK SECURITY CONTEXT
        // =========================================

        System.out.println(
                "Authenticated user: "
                        + SecurityContextHolder
                                .getContext()
                                .getAuthentication());

        System.out.println("=================================");


        // =========================================
        // 8. CONTINUE REQUEST
        // =========================================

        filterChain.doFilter(
                request,
                response);
    }
}
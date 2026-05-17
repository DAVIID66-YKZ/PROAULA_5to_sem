package com.restaurante.reservasapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.restaurante.reservasapp.Jwt.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final AuthenticationProvider authProvider;

        @Bean

public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            // 1. Permitir que el navegador descargue los HTML y recursos
            .requestMatchers("/", "/index", "/login", "/register", "/dashboard", "/reserva", "/mis-reservas").permitAll()
            .requestMatchers("/css/**", "/js/**", "/imagenes/**").permitAll()
            .requestMatchers("/auth/**").permitAll()


            // 2. BLOQUEAR LOS DATOS (La API): Aquí es donde el ROL es ley
            .requestMatchers("/reservas/**").hasRole("CLIENTE")
            .requestMatchers("/mesas/**").hasRole("ADMIN")
            
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}

}
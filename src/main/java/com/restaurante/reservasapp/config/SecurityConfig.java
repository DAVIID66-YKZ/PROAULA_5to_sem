package com.restaurante.reservasapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
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
        

        @Bean

public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth

.requestMatchers("/", "/index", "/login", "/register", "/dashboard", "/dashboardAdmin",
    "/menu", "/reserva", "/mis-reservas", "/calendario", "/perfil", 
    "/ver-menu", "/legal/privacidad", "/legal/terminosYCondiciones" ,"/guardar-bulk","/register-bulk/**").permitAll()
.requestMatchers("/css/**", "/js/**", "/imagenes/**", "/iconos/**").permitAll()
.requestMatchers("/auth/**").permitAll()
.requestMatchers("/usuarios/**").authenticated()
.requestMatchers("/reservas/**", "/calendario/**").hasAnyRole("CLIENTE", "ADMIN")
.requestMatchers("/usuarios/**").hasAnyRole("CLIENTE", "ADMIN")
.requestMatchers("/mesas/**").hasRole("ADMIN")

.anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}

}
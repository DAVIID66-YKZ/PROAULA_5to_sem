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
                // 🔥 CORRECCIÓN 1: Ruta exacta agregada "/reservas/guardar-bulk"
                .requestMatchers("/", "/index", "/login", "/register", "/dashboard", "/dashboardAdmin",
                    "/menu", "/reserva", "/mis-reservas", "/calendario", "/perfil", 
                    "/ver-menu", "/legal/privacidad", "/legal/terminosYCondiciones", 
                    "/reservas/guardar-bulk", "/register-bulk/**").permitAll()
                    
                .requestMatchers("/css/**", "/js/**", "/imagenes/**", "/iconos/**").permitAll()
                .requestMatchers("/auth/**").permitAll()
                
                // 🔥 CORRECCIÓN 2: Uso de hasAuthority para no chocar con MongoDB
                .requestMatchers("/usuarios/**", "/register-bulk/**").authenticated()
                .requestMatchers("/reservas/**", "/calendario/**").hasAnyAuthority("CLIENTE", "ADMIN")
                .requestMatchers("/usuarios/**").hasAnyAuthority("CLIENTE", "ADMIN")
                .requestMatchers("/mesas/**").hasAuthority("ADMIN")
                
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
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

import org.springframework.security.config.http.SessionCreationPolicy;

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
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Recursos estáticos
                .requestMatchers("/css/**", "/js/**", "/imagenes/**", "/iconos/**", "/favicon.ico").permitAll()
                // Vistas públicas
                .requestMatchers("/", "/index", "/login", "/register", "/menu", "/ver-menu", "/legal/**").permitAll()
                // Endpoints de autenticación públicos
                .requestMatchers("/auth/**").permitAll()
                // Vistas HTML que protegen su contenido con token en localStorage vía JS
                .requestMatchers("/dashboard", "/dashboardAdmin", "/reserva", "/mis-reservas", "/calendario", "/perfil").permitAll()
                // Endpoints REST de Administración
                .requestMatchers("/api/admin/**", "/mesas/**").hasRole("ADMIN")
                // Endpoints REST compartidos
                .requestMatchers("/reservas/**").hasAnyRole("CLIENTE", "ADMIN")
                .requestMatchers("/usuarios/**").hasAnyRole("CLIENTE", "ADMIN")
                // Cualquier otra petición requiere autenticación
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
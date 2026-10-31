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
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Peticiones preflight OPTIONS siempre permitidas
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        // Recursos estáticos
                        .requestMatchers("/css/**", "/js/**", "/imagenes/**", "/iconos/**", "/favicon.ico", "/favicon.png", "/favicon*").permitAll()
                        // Vistas públicas
                        .requestMatchers("/", "/index", "/login", "/register", "/menu", "/menu/**", "/legal/**", "/menu/menu.pdf").permitAll()
                        // Endpoints de autenticación públicos
                        .requestMatchers("/auth/**").permitAll()
                        // Vistas HTML de la aplicación (protegen su contenido con token en localStorage vía JS)
                        .requestMatchers(
                                "/cliente/**",
                                "/admin/**",
                                "/dashboard",
                                "/dashboardAdmin",
                                "/reserva",
                                "/mis-reservas",
                                "/calendario",
                                "/perfil"
                        ).permitAll()
                        // Consulta pública de disponibilidad para reservas desde index y carrito
                        .requestMatchers("/reservas/ocupadas").permitAll()
                        // Endpoints REST de Administración
                        .requestMatchers("/api/admin/**", "/mesas/**").hasRole("ADMIN")
                        // Endpoints REST compartidos
                        .requestMatchers("/reservas/**").hasAnyRole("CLIENTE", "ADMIN")
                        .requestMatchers("/usuarios/**").hasAnyRole("CLIENTE", "ADMIN")
                        // Cualquier otra petición requiere autenticación
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOriginPatterns(java.util.List.of("*"));
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("*"));
        configuration.setAllowCredentials(true);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
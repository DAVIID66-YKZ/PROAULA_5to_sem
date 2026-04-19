package com.restaurante.reservasapp.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.restaurante.reservasapp.services.UsuarioSeguridadService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Autowired
        private UsuarioSeguridadService usuarioSeguridadService;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

                return http
                                .csrf(csrf -> csrf.disable())
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/login", "/loginProcess", "/usuarios/guardar",
                                                                "/css/**", "/index", "/", "/imagenes/**")
                                                .permitAll()
                                                .anyRequest().authenticated())
                                .userDetailsService(usuarioSeguridadService)
                                .formLogin(form -> form
                                                .loginPage("/login")
                                                .loginProcessingUrl("/loginProcess")
                                                .usernameParameter("correo")
                                                .passwordParameter("contrasena")
                                                .defaultSuccessUrl("/index", false)
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutUrl("/logout")
                                                .logoutSuccessUrl("/login?logout")
                                                .permitAll())
                                .build();
        }

}

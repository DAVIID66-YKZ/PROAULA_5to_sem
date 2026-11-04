package com.restaurante.reservasapp.config;

import java.util.Properties;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import io.github.cdimascio.dotenv.Dotenv;

@Configuration
public class EmailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        String gmailUsername = obtenerVariable(dotenv, "GMAIL_USERNAME");
        String gmailPassword = obtenerVariable(dotenv, "GMAIL_APP_PASSWORD");

        if (gmailUsername == null || gmailUsername.isBlank() || gmailPassword == null || gmailPassword.isBlank()) {
            throw new IllegalStateException("Las variables de gmail no estan configuradas correctamente");
        }

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(gmailUsername);
        mailSender.setPassword(gmailPassword);
        mailSender.setDefaultEncoding("UTF-8");

        Properties properties = mailSender.getJavaMailProperties();

        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.starttls.enable", "true");
        properties.put("mail.smtp.starttls.required", "true");
        properties.put("mail.smtp.connectiontimeout", "5000");
        properties.put("mail.smtp.timeout", "5000");
        properties.put("mail.smtp.writetimeout", "5000");

        return mailSender;
    }

    private String obtenerVariable(Dotenv dotenv, String nombre) {
        String valor = dotenv.get(nombre);

        if (valor == null || valor.isBlank()) {
            valor = System.getenv(nombre);
        }
        return valor;
    }
}

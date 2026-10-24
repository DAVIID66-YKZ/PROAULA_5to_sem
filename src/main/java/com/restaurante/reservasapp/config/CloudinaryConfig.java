package com.restaurante.reservasapp.config;

import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import io.github.cdimascio.dotenv.Dotenv;

@Configuration 
public class CloudinaryConfig {
    
    @Bean
    public Cloudinary cloudinary(){
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        String cloudName = obtenerVariable(dotenv, "CLOUDINARY_CLOUD_NAME");
        String apiKey = obtenerVariable(dotenv, "CLOUDINARY_API_KEY");
        String apiSecret = obtenerVariable(dotenv, "CLOUDINARY_API_SECRET");

        if (cloudName == null || apiKey == null || apiSecret == null) {
            throw new IllegalStateException("Las variables de entorno de Cloudinary no están configuradas correctamente.");
        }

        Map<String, Object> configuracion = ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret,
            "secure", true
        );

        return new Cloudinary(configuracion);
    }

    private String obtenerVariable(Dotenv dotenv, String nombre){
        String valor = dotenv.get(nombre);
        if (valor == null || valor.isBlank()){
            valor = System.getenv(nombre);
        }
        return valor;
    }
}

package com.restaurante.reservasapp.Entity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor 
@Document(collection = "verificaciones_correo")
public class VerificacionEntity {

    @Id
    private String usuarioId;

    private String codigoHash;

    private Instant fechaCreacion;

    private Instant fechaExpiracion;

    @Builder.Default
    private int intentos = 0;

}

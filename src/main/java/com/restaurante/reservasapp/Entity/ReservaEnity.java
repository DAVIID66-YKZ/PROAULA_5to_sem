package com.restaurante.reservasapp.Entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reservas")
public class ReservaEnity {

    @Id
    private String id;

    private String fecha;
    private String hora;
    private int numeroPersonas;

    private String usuarioId;
    private String mesaId;
}
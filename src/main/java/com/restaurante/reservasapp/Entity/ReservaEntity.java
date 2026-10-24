package com.restaurante.reservasapp.Entity;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reservas")
public class ReservaEntity {

    @Id
    private String id;
    private String fecha;
    private String hora;
    private int numeroPersonas;
    private String usuarioId;
    private String mesaId;
    private List<String> platos; // 🔥 NUEVO: Almacena los IDs de los platos seleccionados 
    private String experiencia; 
    private String comentario; // 🔥 NUEVO: Almacenará la reseña del manuscrito
    private String estado;     // 🔥 NUEVO: Almacena el estado (CONFIRMADA, PENDIENTE, LLEGADA, etc.)
}
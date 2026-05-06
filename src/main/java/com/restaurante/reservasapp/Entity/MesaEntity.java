package com.restaurante.reservasapp.Entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "mesas")
public class MesaEntity {

    @Id
    private String id;

    private int numero;
    private int capacidad;
    private boolean disponible;
}
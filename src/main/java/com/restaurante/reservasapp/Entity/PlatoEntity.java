package com.restaurante.reservasapp.Entity;

import java.math.BigDecimal;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "platos")
public class PlatoEntity {

    @Id
    private String id;

    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private String categoria;
    private String imgUrl;
    private boolean disponible;
}

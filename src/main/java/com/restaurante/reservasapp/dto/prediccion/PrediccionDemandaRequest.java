package com.restaurante.reservasapp.dto.prediccion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrediccionDemandaRequest {
    private String fechaInicio;
    private String fechaFin;
    private String turno; // "ALMUERZO", "CENA", "COMPLETO"
}


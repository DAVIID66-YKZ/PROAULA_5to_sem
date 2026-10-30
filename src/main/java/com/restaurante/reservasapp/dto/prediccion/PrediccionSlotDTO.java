package com.restaurante.reservasapp.dto.prediccion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrediccionSlotDTO {
    private String fecha;
    private String hora;
    private int franjaHoraria;
    private double comensalesEstimados;
    private int comensalesReales;
    private int reservasRealesCount;
    private int mesasSugeridas;
    private int capacidadTotalMesas;
    private int capacidadTotalComensales;
    private double ocupacionProyectadaPorcentaje;
    private double ocupacionRealPorcentaje;
}


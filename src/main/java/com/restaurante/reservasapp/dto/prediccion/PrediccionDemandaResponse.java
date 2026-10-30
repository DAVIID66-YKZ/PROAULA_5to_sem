package com.restaurante.reservasapp.dto.prediccion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrediccionDemandaResponse {
    private String fechaInicio;
    private String fechaFin;
    private String turno;
    private double totalComensalesEstimados;
    private int totalComensalesReales;
    private int totalReservasReales;
    private int mesasSugeridasPico;
    private int totalMesasRestaurante;
    private int capacidadMaximaLocal;
    private double ocupacionProyectadaGlobal;
    private double ocupacionRealGlobal;
    private String alertaCapacidad;
    private List<PrediccionSlotDTO> series;
    private long timestamp;
}


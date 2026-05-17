package com.restaurante.reservasapp.Auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservaParaDashboardResponse {
    private String id;
    private String nombreHuesped;
    private String iniciales;
    private String fechaHora;
    private int cantidadPersonas;
    private String numeroMesa;
    private String estado;
    private String tipoEvento;
}

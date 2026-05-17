package com.restaurante.reservasapp.services;

import com.restaurante.reservasapp.Auth.DashboardResponse;
import com.restaurante.reservasapp.Auth.ReservaParaDashboardResponse;

import java.util.List;

public interface DashboardService {
    DashboardResponse obtenerEstadisticasGenerales();
    List<ReservaParaDashboardResponse> obtenerReservasRecientes(int pagina, int tamanoPagina);
    long contarReservasPorEstado(String estado);
}

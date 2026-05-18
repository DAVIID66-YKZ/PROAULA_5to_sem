package com.restaurante.reservasapp.services;

import com.restaurante.reservasapp.Auth.DashboardAdminResponse;
import com.restaurante.reservasapp.Auth.ReservaParaDashboardAdminResponse;

import java.util.List;

public interface DashboardAminService {
    DashboardAdminResponse obtenerEstadisticasGenerales();
    List<ReservaParaDashboardAdminResponse> obtenerReservasRecientes(int pagina, int tamanoPagina);
    long contarReservasPorEstado(String estado);
}

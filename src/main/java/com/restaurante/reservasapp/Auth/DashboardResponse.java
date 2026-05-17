

package com.restaurante.reservasapp.Auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private int ocupanciaTotal;              // Porcentaje de ocupancia (84%)
    private int totalHuespedes;              // Total de huéspedes actuales (142)
    private int listaEsperaCount;            // Personas en lista de espera (08)
    private long totalReservas;              // Total de reservas en el sistema
    private long reservasConfirmadas;        // Reservas confirmadas
    private long reservasPendientes;         // Reservas pendientes
    private long reservasArrivadas;          // Reservas que llegaron
    private int mesasActivas;                // Mesas disponibles/activas
    private int mesasTotales;                // Total de mesas
}